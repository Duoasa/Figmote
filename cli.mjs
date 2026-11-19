#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { call } from './client.mjs'
import { LOCAL_TOOLS } from './index.mjs'
import { serve } from './lib/service.mjs'
import { saveAssets } from './lib/assets.mjs'

const usage = `figmote serve [--port PORT]
figmote tools [TOOL]
figmote status
figmote select CONNECTION_ID
figmote call TOOL [--args-file PATH]
figmote exec SCRIPT.js

Set FIGMOTE_SESSION to a stable, unique name for each conversation.
Run client commands from the intended workspace. Optional: FIGMOTE_HOME.`
async function main([command, ...args]) {
  if (!command || command === '--help' || command === 'help') return console.log(usage)
  if (command === 'serve') {
    if (args.length && (args.length !== 2 || args[0] !== '--port')) throw new Error(usage)
    const service = await serve({ port: args.length ? Number(args[1]) : 3055 })
    console.log(JSON.stringify({ manifest: service.manifest, port: service.port, status: 'listening' }))
    const close = () => {
      void service.close().catch((error) => {
        console.error(error.message)
        process.exitCode = 1
      })
    }
    process.once('SIGINT', close)
    process.once('SIGTERM', close)
    return
  }
  if (command === 'tools') {
    const tool = args.length ? LOCAL_TOOLS.find((t) => t.name === args[0]) : LOCAL_TOOLS.map((t) => t.name)
    if (!tool || args.length > 1) throw new Error('Unknown tool. Run figmote tools.')
    return console.log(JSON.stringify(tool, null, 2))
  }
  let payload = {},
    method = command
  if (command === 'call' && (args.length === 1 || (args.length === 3 && args[1] === '--args-file'))) {
    method = args[0]
    if (args.length === 3) payload = JSON.parse(await readFile(args[2], 'utf8'))
  } else if (command === 'exec' && args.length === 1) {
    method = 'use_figma'
    payload = { code: await readFile(args[0], 'utf8') }
  } else if (command === 'select' && args.length === 1) payload = { connectionId: args[0] }
  else if (command !== 'status' || args.length) throw new Error(usage)
  const response = await call(method, payload, { sessionId: process.env.FIGMOTE_SESSION })
  const value = response.structuredContent
  const images = response.content.filter((block) => block.type === 'image')
  if (images.length) {
    try {
      value.images = await saveAssets(
        process.cwd(),
        images.map((image, i) => ({ ...image, name: 'preview-' + (i + 1) + '.bin' })),
      )
    } catch (error) {
      value.imageOutputError = error.message
      value.nextAction = 'Inspect the operation result and request the screenshot separately.'
      process.exitCode = 1
    }
  }
  console.log(JSON.stringify(value, null, 2))
  if (response.isError) process.exitCode = 1
}
main(process.argv.slice(2)).catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
