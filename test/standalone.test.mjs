import test from 'node:test'
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { serve } from '../lib/service.mjs'
import { call } from '../client.mjs'
import { LOCAL_TOOLS } from '../index.mjs'
import { connect, fixtureRuntime, runJob, PNG } from './fixtures.mjs'

const run = promisify(execFile)
const cli = fileURLToPath(new URL('../cli.mjs', import.meta.url))
test('inventory matches the entire local catalog', async () => {
  const inventory = await readFile(new URL('../CAPABILITIES.md', import.meta.url), 'utf8')
  assert.equal(LOCAL_TOOLS.length, 43)
  for (const tool of LOCAL_TOOLS) assert.ok(inventory.includes('| `' + tool.name + '` |'))
})
test(
  'standalone CLI and client share a service and isolate document bindings',
  { timeout: 20000 },
  async (t) => {
    const home = await mkdtemp('/tmp/figmote-test-')
    t.after(() => rm(home, { recursive: true, force: true }))
    const service = await serve({ home, port: 0 })
    t.after(() => service.close())
    const manifest = JSON.parse(await readFile(service.manifest, 'utf8'))
    assert.equal(manifest.name, 'Figmote · Local')
    const bridge = { port: service.port, token: await readFile(join(home, 'figma', 'bridge-token'), 'utf8') }
    const context = { sessionId: 'second-agent', home, workspace: home }
    const cmd = async (...args) =>
      JSON.parse(
        (
          await run(process.execPath, [cli, ...args], {
            cwd: home,
            env: { ...process.env, FIGMOTE_HOME: home, FIGMOTE_SESSION: 'first-agent' },
          })
        ).stdout,
      )
    const first = await connect(bridge, 'First', 7),
      second = await connect(bridge, 'Second', 7)
    assert.equal((await cmd('status')).documents.length, 2)
    await cmd('select', first)
    await call('select', { connectionId: second }, context)
    assert.equal((await call('status', {}, context)).structuredContent.documentBinding.id, second)
    const { runtime, page } = await fixtureRuntime()
    const script = join(home, 'create.js')
    await writeFile(
      script,
      "const frame=figma.createFrame(); figma.currentPage.appendChild(frame); frame.name='Figmote'; return {id:frame.id}",
    )
    const [write] = await Promise.all([cmd('exec', script), runJob(bridge, first, runtime)])
    assert.equal(page.children[0].id, write.result.id)
    const [selection] = await Promise.all([cmd('call', 'get_selection'), runJob(bridge, first, runtime)])
    assert.ok(selection.result.page.id)
    const input = join(home, 'shot.json')
    await writeFile(input, JSON.stringify({ nodeId: write.result.id }))
    const [shot] = await Promise.all([
      cmd('call', 'get_screenshot', '--args-file', input),
      runJob(bridge, first, runtime),
    ])
    assert.deepEqual(await readFile(shot.images[0].path), PNG)
    assert.equal(page.children.length, 1)
    const failure = await call('use_figma', { code: 'const =broken' }, context)
    assert.equal(failure.isError, true)
    assert.equal(failure.structuredContent.safeToRetryWithoutCanvasRead, true)
  },
)
