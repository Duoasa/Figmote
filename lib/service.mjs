import { createServer } from 'node:http'
import { once } from 'node:events'
import { chmod } from 'node:fs/promises'
import { startRuntime, defaultHome } from '../index.mjs'
import { socketPath } from '../client.mjs'
import { privateDirectory } from './storage.mjs'

// Only the Figma companion uses loopback TCP. Rich agent calls, including workspace
// access, are restricted to a Unix socket in the user's mode-0700 state directory.
export async function serve({ home = defaultHome(), port = 3055 } = {}) {
  if (process.platform === 'win32') throw new Error('The agent socket requires macOS or Linux.')
  if (!Number.isInteger(port) || (port !== 0 && port < 1024) || port < 0 || port > 65535)
    throw new Error('Choose 0 for a free port or a port from 1024 to 65535.')
  await privateDirectory(home)
  let runtime
  const server = createServer(async (req, res) => {
    const send = (status, value) => {
      if (res.destroyed) return
      res.writeHead(status, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(value))
    }
    if (!runtime) return send(503, { error: 'Figmote is starting' })
    if (
      req.url !== '/call' ||
      req.method !== 'POST' ||
      req.headers.origin ||
      req.headers['content-type'] !== 'application/json'
    )
      return send(400, { error: 'Invalid local request' })
    const cancel = new AbortController()
    res.on('close', () => {
      if (!res.writableEnded) cancel.abort()
    })
    try {
      const chunks = []
      let bytes = 0
      for await (const chunk of req) {
        bytes += chunk.length
        if (bytes > 16 * 1024 * 1024) throw new Error('Request exceeds 16 MiB')
        chunks.push(chunk)
      }
      const { method, args, sessionId, workspace } = JSON.parse(Buffer.concat(chunks).toString())
      send(200, await runtime.invoke(method, args, { sessionId, workspace, signal: cancel.signal }))
    } catch (error) {
      send(400, { error: error.message })
    }
  })
  const path = socketPath(home)
  if (Buffer.byteLength(path) > 100)
    throw new Error('Use a shorter absolute FIGMOTE_HOME for the local socket.')
  server.listen(path)
  await once(server, 'listening')
  try {
    await chmod(path, 0o600)
    runtime = await startRuntime({ home, port })
  } catch (error) {
    server.close()
    throw error
  }
  return {
    manifest: runtime.manifest,
    port: runtime.port,
    async close() {
      server.close()
      await runtime.close()
      server.closeAllConnections()
    },
  }
}
