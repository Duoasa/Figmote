import pkg from './package.json' with { type: 'json' }
import { createHash, randomUUID } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import Ajv from 'ajv'
import { readAssets, saveAssets, localResult } from './lib/assets.mjs'
import { recoveryResponse } from './lib/recovery.mjs'
import { compareReference } from './lib/compare-reference.mjs'
import { readOnlyProgram } from './lib/readonly-program.mjs'
import { LocalBridge } from './lib/bridge.mjs'
import { bridgeToken, privateJson, readJson } from './lib/storage.mjs'
import { LOCAL_TOOLS, requiredQueryFeatureVersion } from './lib/catalog.mjs'
import { PerformanceLog } from './lib/performance.mjs'
import { prepareCompanion } from './lib/companion.mjs'
import { FIGMA_USE_CONTRACT, LocalFigmaTasks } from './lib/figma-use-contract.mjs'
import { IdempotencyStore } from './lib/idempotency.mjs'
import { StepTasks } from './lib/workflows.mjs'
import { errorDetails, bindingFailure } from './lib/errors.mjs'
import { preflightScript, ScriptPreflightError } from './lib/script-preflight.mjs'
import { designSync } from './lib/design-sync.mjs'
import { scanProject, matchProjectAssets, projectMappings } from './lib/project-index.mjs'
import { recipes } from './lib/recipes.mjs'
import { saveMediaTransfer } from './lib/media-store.mjs'
import { captureDomSnapshot } from './lib/dom-capture.mjs'

export { LOCAL_TOOLS }
export const defaultHome = () => process.env.FIGMOTE_HOME || join(homedir(), '.figmote')
const validators = new Map()
const ajv = new Ajv({ strict: false })
function validate(tool, args) {
  if (!validators.has(tool.name)) validators.set(tool.name, ajv.compile(tool.inputSchema))
  const check = validators.get(tool.name)
  if (!check(args)) throw new Error(ajv.errorsText(check.errors))
}
const result = (value) => ({
  content: [{ type: 'text', text: JSON.stringify(value) }],
  structuredContent: value,
})

export async function startRuntime({ home = defaultHome(), port = 3055, timeoutMs = 120000 } = {}) {
  if (!isAbsolute(home)) throw new Error('Figmote home must be absolute')
  const bridge = new LocalBridge({ token: await bridgeToken(home), port, timeoutMs })
  await bridge.start()
  let companion
  try {
    companion = await prepareCompanion(home, { port: bridge.port, token: bridge.token })
  } catch (error) {
    await bridge.close()
    throw error
  }
  const bindings = new Map(),
    performanceLogs = new Map()
  const shutdown = new AbortController()
  const figmaTasks = new LocalFigmaTasks(),
    idempotency = new IdempotencyStore(home)
  const stepTasks = new StepTasks(home),
    localCalls = new Map()
  function bindingPath(sessionId) {
    const key = createHash('sha256').update(sessionId).digest('hex')
    return join(home, 'figma', 'binding-' + key + '.json')
  }
  async function findBinding(sessionId) {
    if (bindings.has(sessionId)) return bindings.get(sessionId)
    const saved = await readJson(bindingPath(sessionId), null)
    return bindings.get(sessionId) ?? saved
  }
  async function bindDocument(session, workspace, doc) {
    const binding = {
      id: doc.connectionId,
      workspace,
      fileKey: doc.fileKey,
      name: doc.name,
      editorType: doc.editorType,
    }
    await privateJson(bindingPath(session.id), binding)
    bindings.set(session.id, binding)
    return binding
  }
  function metricsFor(session) {
    if (!performanceLogs.has(session.id)) performanceLogs.set(session.id, new PerformanceLog())
    return performanceLogs.get(session.id)
  }
  const persistExport = async (id, operationId, owner, workspace, signal, descriptor) => {
    const pending = bridge.takeExport
      ? bridge.takeExport(id, operationId, owner)
      : descriptor
        ? { transfer: descriptor }
        : null
    if (!pending) return null
    try {
      const file = await saveMediaTransfer(workspace, pending.transfer, {
        signal,
        readChunk: async (chunk) =>
          (await bridge.call(id, 'read_export_chunk', chunk, { signal, owner })).value,
        release: async (transfer) => (await bridge.call(id, 'release_export', transfer, { owner })).value,
      })
      const saved = { result: { file }, operationId }
      bridge.completeOutput?.(id, operationId, owner, saved)
      return saved
    } catch (error) {
      bridge.failOutput?.(id, operationId, owner, error)
      throw Object.assign(
        new Error(
          String(error?.message || error).replace(/ \[operationId=[^\]]+\]/g, '') +
            ' [operationId=' +
            operationId +
            ']',
          { cause: error },
        ),
        { operationId, safeToRetryWithoutCanvasRead: false },
      )
    }
  }
  for (const tool of LOCAL_TOOLS) {
    const call = async (args, exec) => {
      let dispatched = false,
        lease
      try {
        const { session, workspace, signal } = exec
        validate(tool, args)
        if (tool.hostOnly) {
          if (tool.name === 'project_index') return result(await scanProject(workspace, args))
          if (tool.name === 'project_match')
            return result(
              matchProjectAssets(await scanProject(workspace, {}), {
                ...args,
                mappings: (await projectMappings(workspace)).mappings,
              }),
            )
          if (tool.name === 'project_mappings') return result(await projectMappings(workspace, args))
          if (tool.name === 'local_recipes') {
            if (args.action === 'save') preflightScript(args.code)
            return result(await recipes(workspace, args))
          }
        }
        let binding = await findBinding(session.id)
        if (!binding) {
          const documents = bridge.list()
          if (documents.length !== 1) throw bindingFailure(documents, null, workspace)
          binding = await bindDocument(session, workspace, documents[0])
        }
        const document = bridge.list().find((doc) => doc.connectionId === binding.id)
        if (!document) throw bindingFailure(bridge.list(), binding, workspace)
        if (binding.workspace !== workspace)
          throw new Error('Work workspace changed; explicitly select the document again')
        if ((document.featureVersion ?? 0) < requiredQueryFeatureVersion(tool.name, args))
          throw new Error(
            'The connected Figma companion does not support these query features yet. Restart Figmote and reopen the plugin from its paired manifest; inspect figmote status and reselect the document. Legacy queries remain available.',
          )
        const context = figmaTasks.context(session.id, workspace, document, args)
        if (tool.name === 'run_steps') {
          if (args.action === 'resolve' && (document.busy || document.needsInspection))
            throw Object.assign(
              Error('Inspect affected resources and wait for the active write before resolving this step'),
              { recovery: { needsInspection: true } },
            )
          return result(
            await stepTasks.run([session.id, workspace, context.fileKey], args, (name, payload) =>
              localCalls.get(name)(payload, exec),
            ),
          )
        }
        if (tool.mutation && args.idempotencyKey !== undefined) {
          lease = await idempotency.begin(
            [session.id, workspace, context.fileKey],
            args.idempotencyKey,
            tool.name,
            args,
          )
          if (lease.output !== undefined) return lease.output
        }
        if (tool.name === 'operation_status') {
          const status = bridge.operation(binding.id, args.operationId, session.id, false)
          if (
            args.includeResult &&
            status.method === 'export_video' &&
            status.state === 'completed' &&
            status.outputState === 'pending'
          )
            await persistExport(binding.id, args.operationId, session.id, workspace, signal)
          return result(bridge.operation(binding.id, args.operationId, session.id, args.includeResult))
        }
        if (tool.name === 'create_session')
          return result(figmaTasks.create(session.id, workspace, document, args))
        if (
          tool.name === 'get_metadata' &&
          args.responseMode === 'recovery' &&
          (!args.nodeId ||
            args.profile === 'summary' ||
            args.offset !== undefined ||
            args.limit !== undefined)
        )
          throw new Error(
            'Recovery response requires affected nodeId, full/default profile and no offset/limit',
          )
        const preparedCode =
          tool.name === 'use_figma'
            ? preflightScript(args.code, {
                codeLayerCreation: document.capabilities?.features?.codeLayerCreation?.state,
              })
            : undefined
        if (
          tool.name === 'use_figma' &&
          args.verify &&
          (Boolean(args.verify.nodeId) === Boolean(args.verify.resultPath) ||
            (args.verify.resultPath &&
              !/^(?:\$|[A-Za-z_][A-Za-z0-9_]*)(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/.test(args.verify.resultPath)))
        )
          throw Error('verify requires exactly one nodeId or resultPath')
        const readProgram =
          tool.name === 'use_figma' && args.readOnly ? readOnlyProgram(preparedCode) : undefined
        if (args.readOnly && args.trackCreated) throw Error('readOnly and trackCreated cannot be combined')
        if (tool.name === 'rollback') {
          const original = bridge.operation(binding.id, args.operationId, session.id, false)
          if (original.method !== 'use_figma' || original.state !== 'failed')
            throw Error('Rollback requires a failed use_figma operation owned by this Work/file')
        }
        const id = binding.id
        const performanceLog = metricsFor(session)
        const started = performance.now()
        let payload =
            preparedCode !== undefined
              ? { ...args, code: preparedCode, ...(readProgram ? { readOnlyProgram: readProgram } : {}) }
              : args,
          response,
          output,
          bridgeMetric,
          capture,
          status = 'failed',
          method = tool.name
        const operationId = randomUUID()
        try {
          if (tool.name === 'compare')
            payload = {
              ...args,
              reference: undefined,
              referenceImage: await compareReference({
                workspace,
                session,
                attachments: exec.attachments,
                reference: args.reference,
                signal,
              }),
            }
          if (tool.name === 'upload_assets')
            payload = { ...args, files: undefined, assets: await readAssets(workspace, args.files) }
          if (tool.name === 'capture_webpage') {
            capture = await captureDomSnapshot({ ...args, signal })
            payload = {
              snapshot: capture.snapshot ?? capture,
              fontPolicy: args.fontPolicy,
              origin: args.origin,
            }
            method = 'import_dom_snapshot'
          }
          if (tool.name === 'design_diff') {
            method = 'get_design_context'
            payload = {
              nodeId: args.nodeId,
              semantic: true,
              includeScreenshot: false,
              dedupeStyles: false,
              dedupeComponents: false,
              maxNodes: args.maxNodes ?? 1500,
              maxBytes: args.maxBytes ?? 2097152,
              depth: 30,
            }
          }
          dispatched = true
          if (context.task) {
            context.task.calls++
            context.task.files.add(context.fileKey)
          }
          response = await bridge.call(id, method, payload, {
            signal,
            operationId,
            owner: session.id,
            mutation: tool.mutation && !(tool.name === 'use_figma' && args.readOnly),
            ...(tool.name === 'rollback' ? { recoveryOf: args.operationId } : {}),
            inspect:
              tool.inspect &&
              args.profile !== 'summary' &&
              args.offset === undefined &&
              args.limit === undefined,
            onMetric: (metric) => {
              bridgeMetric = metric
            },
          })
          if (tool.name !== 'export_video') signal.throwIfAborted()
          if (tool.name === 'design_diff')
            response.value = await designSync({
              workspace,
              fileKey: context.fileKey,
              nodeId: args.nodeId,
              snapshot: response.value,
              captureOptions: payload,
              action: args.action ?? 'compare',
              expectedRevision: args.expectedRevision,
            })
          if (tool.name === 'export_video' && response.value?.transfer) {
            const saved = await persistExport(
              id,
              operationId,
              session.id,
              workspace,
              signal,
              response.value.transfer,
            )
            if (!saved)
              throw Object.assign(
                new Error(
                  'Export transfer unavailable; query operation_status before taking any further action',
                ),
                { operationId },
              )
            response.value = saved.result
          }
          if (tool.name === 'download_assets')
            response.value = { ...response.value, files: await saveAssets(workspace, response.assets) }
          if (capture?.diagnostics) response.value = { ...response.value, capture: capture.diagnostics }
          signal.throwIfAborted()
          const files =
            tool.name === 'use_figma' && response.assets?.length
              ? await saveAssets(workspace, response.assets)
              : []
          if (tool.name === 'get_metadata' && args.responseMode === 'recovery')
            response.value = recoveryResponse(response.value, response.recovery)
          output = localResult(response)
          if (response.verification) {
            output.structuredContent.verification = response.verification
            output.content.push({
              type: 'text',
              text: JSON.stringify({ verification: response.verification }),
            })
          }
          if (response.journal) {
            output.structuredContent.journal = response.journal
            output.content.push({ type: 'text', text: JSON.stringify({ journal: response.journal }) })
          }
          if (response.recovery) {
            output.structuredContent.recovery = response.recovery
            output.content.push({ type: 'text', text: JSON.stringify({ recovery: response.recovery }) })
          }
          if (files.length) {
            output.structuredContent.files = files
            output.content.push({ type: 'text', text: JSON.stringify({ files }) })
          }
          if (tool.name === 'use_figma')
            output.structuredContent.execution = {
              fileKey: context.fileKey,
              sessionId: context.sessionId,
              description: args.description ?? null,
              skillNames: args.skillNames ?? null,
            }
          output.structuredContent.operationId = operationId
          bridge.completeOutput?.(id, operationId, session.id, output.structuredContent)
          if (lease) await idempotency.finish(lease, output)
          status = 'ok'
          return output
        } finally {
          if (signal.aborted) status = 'canceled'
          performanceLog.record({
            tool: tool.name,
            status,
            hostMs: performance.now() - started,
            bridge: bridgeMetric,
            runtime: response?.metrics,
            textBytes: output ? Buffer.byteLength(output.content[0].text) : null,
            imageCount: output ? output.content.filter((block) => block.type === 'image').length : null,
            imageBytes: output
              ? output.content
                  .filter((block) => block.type === 'image')
                  .reduce((total, block) => total + Buffer.byteLength(block.data, 'base64'), 0)
              : null,
          })
        }
      } catch (error) {
        const value = {
          error: String(error?.message || error),
          safeToRetryWithoutCanvasRead:
            error.executionState === 'unknown'
              ? false
              : !dispatched || error?.safeToRetryWithoutCanvasRead === true,
          ...(error.operationId ? { operationId: error.operationId } : {}),
          ...(error.batchResult ? { batchResult: error.batchResult } : {}),
          ...(error.createdNodeIds ? { createdNodeIds: error.createdNodeIds } : {}),
        }
        if (error.recovery) value.recovery = error.recovery
        if (error.cleanup) value.cleanup = error.cleanup
        if (!dispatched && error instanceof ScriptPreflightError)
          value.diagnostic = { stage: 'preflight', ...error.diagnostic }
        else if (dispatched) {
          const { variableModeLimitDiagnostic } = await import('./lib/native-diagnostics.mjs')
          const diagnostic = variableModeLimitDiagnostic(error)
          if (diagnostic) {
            const { code, stage, scope, limit, nativeError } = diagnostic
            value.diagnostic = {
              code,
              stage,
              scope,
              limit,
              nativeError,
              hint: 'Follow reconcile; inspect affected values with get_variable_defs and canvas nodes with get_metadata as needed.',
            }
          }
        }
        Object.assign(
          value,
          errorDetails(error, {
            safe: value.safeToRetryWithoutCanvasRead,
            diagnostic: value.diagnostic,
            args,
          }),
        )
        if (value.reconcile?.tool === 'get_variable_defs' && value.recovery)
          value.recovery = { needsInspection: true, hint: 'Read affected collection values using reconcile.' }
        const output = { ...result(value), isError: true }
        if (lease?.id) await idempotency.finish(lease, output)
        return output
      }
    }
    localCalls.set(tool.name, call)
  }
  async function invoke(
    method,
    args = {},
    { sessionId, workspace, signal, attachments, deriveMessages } = {},
  ) {
    if (typeof sessionId !== 'string' || !sessionId.trim() || sessionId.length > 200)
      throw new Error('Supply a unique session identifier (1–200 characters)')
    if (typeof workspace !== 'string' || !isAbsolute(workspace))
      throw new Error('Supply an absolute workspace')
    workspace = await realpath(workspace)
    const session = { id: sessionId, deriveMessages }
    signal = signal ? AbortSignal.any([signal, shutdown.signal]) : shutdown.signal
    signal.throwIfAborted()
    if (method === 'status')
      return result({
        version: pkg.version,
        available: true,
        port: bridge.port,
        manifest: companion.manifest,
        documentBinding: await findBinding(sessionId),
        documents: bridge.list(),
        figmaUseContract: FIGMA_USE_CONTRACT,
        ...(args.includeMetrics
          ? {
              performance: metricsFor(session).snapshot({
                since: args.metricsSince,
                details: args.metricsDetails === true,
              }),
            }
          : {}),
      })
    if (method === 'select') {
      const doc = bridge.list().find((item) => item.connectionId === args.connectionId)
      if (!doc) throw new Error('Document is not connected')
      return result(await bindDocument(session, workspace, doc))
    }
    const call = localCalls.get(method)
    if (!call) throw new Error('Unknown tool: ' + method)
    return await call(args, { session, workspace, signal, attachments })
  }
  return {
    invoke,
    manifest: companion.manifest,
    port: bridge.port,
    async close() {
      shutdown.abort()
      await bridge.close()
    },
  }
}
