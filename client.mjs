import { request } from 'node:http'
import { homedir } from 'node:os'
import { resolve, join } from 'node:path'

export function socketPath(home = process.env.FIGMOTE_HOME || join(homedir(), '.figmote')) {
  return join(resolve(home), 'figma', 'agent.sock')
}

/** Connect to the service owned by the current OS user. */
export async function call(method, args, { sessionId, workspace = process.cwd(), home, signal } = {}) {
  if (!sessionId) throw new Error('Set FIGMOTE_SESSION to a unique identifier for this agent conversation.')
  const body = JSON.stringify({ method, args, sessionId, workspace: resolve(workspace) })
  return new Promise((accept, reject) => {
    const req = request(
      {
        socketPath: socketPath(home),
        path: '/call',
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
      },
      (res) => {
        const chunks = []
        res.on('error', reject)
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          try {
            const value = JSON.parse(Buffer.concat(chunks).toString())
            if (res.statusCode !== 200) throw new Error(value.error || 'Service request failed')
            accept(value)
          } catch (error) {
            reject(error)
          }
        })
      },
    )
    req.on('error', (error) =>
      reject(
        ['ENOENT', 'ECONNREFUSED'].includes(error.code)
          ? new Error('Figmote service is unavailable. Run figmote serve in a local terminal.')
          : error,
      ),
    )
    req.end(body)
  })
}
