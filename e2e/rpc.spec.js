import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from './fixtures.js'

// aria2's RPC must never be reachable without the per-install secret: any local
// process or web page could otherwise add downloads to an arbitrary directory.
test('the aria2 RPC endpoint rejects requests without the rpc-secret', async ({ window, homeDir }) => {
  const config = await window.evaluate(() => window.electron.ipcRenderer.invoke('get-app-config'))
  const port = config['rpc-listen-port']
  const secret = config['rpc-secret']

  expect(secret).toBeTruthy()
  expect(secret.length).toBeGreaterThanOrEqual(16)

  const call = async (params) => {
    const res = await fetch(`http://127.0.0.1:${port}/jsonrpc`, {
      method: 'POST',
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'aria2.getVersion', params })
    })
    return res.json()
  }

  const withoutSecret = await call([])
  expect(withoutSecret.error).toBeTruthy()
  expect(withoutSecret.error.message).toMatch(/unauthorized/i)

  const withSecret = await call([`token:${secret}`])
  expect(withSecret.result).toBeTruthy()
  expect(withSecret.result.version).toBeTruthy()

  const configDir = join(homeDir, '.config')
  const productDir = existsSync(configDir) ? readdirSync(configDir).find((d) => d.startsWith('Motrix')) : null
  expect(productDir).toBeTruthy()

  const stored = JSON.parse(readFileSync(join(configDir, productDir, 'system.json'), 'utf8'))
  expect(stored['rpc-secret']).toBe(secret)
})
