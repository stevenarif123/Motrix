import { createServer } from 'node:http'
import { createReadStream, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, extname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test as base, _electron } from '@playwright/test'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const repoRoot = resolve(__dirname, '..')
const assetsDir = join(__dirname, 'assets')

const CONTENT_TYPES = {
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.bin': 'application/octet-stream',
  '.torrent': 'application/x-bittorrent'
}

const startAssetServer = () => new Promise((resolve) => {
  const server = createServer((req, res) => {
    const path = join(assetsDir, decodeURIComponent(req.url.split('?')[0]))
    if (!path.startsWith(assetsDir) || !statSync(path, { throwIfNoEntry: false })) {
      res.writeHead(404)
      res.end()
      return
    }
    res.writeHead(200, { 'Content-Type': CONTENT_TYPES[extname(path)] || 'application/octet-stream' })
    createReadStream(path).pipe(res)
  })
  server.listen(0, '127.0.0.1', () => resolve(server))
})

export const test = base.extend({
  // eslint-disable-next-line no-empty-pattern
  homeDir: async ({}, use) => {
    const dir = mkdtempSync(join(tmpdir(), 'motrix-e2e-'))
    await use(dir)
    rmSync(dir, { recursive: true, force: true })
  },

  // eslint-disable-next-line no-empty-pattern
  server: async ({}, use) => {
    const server = await startAssetServer()
    const { port } = server.address()
    await use({ url: `http://127.0.0.1:${port}`, asset: (name) => `http://127.0.0.1:${port}/${name}` })
    await new Promise((resolve) => server.close(resolve))
  },

  electronApp: async ({ homeDir }, use) => {
    const app = await _electron.launch({
      executablePath: join(repoRoot, 'node_modules/electron/dist/electron'),
      args: [repoRoot, '--no-sandbox'],
      env: {
        ...process.env,
        HOME: homeDir,
        XDG_CONFIG_HOME: join(homeDir, '.config')
      },
      timeout: 30000
    })
    await use(app)

    // app.close() occasionally hangs (a lingering aria2 child, an open socket).
    // Never let a stuck teardown eat the whole suite's time budget.
    try {
      await Promise.race([
        app.close(),
        new Promise((_resolve, reject) => setTimeout(() => reject(new Error('app.close() timed out')), 8000))
      ])
    } catch (err) {
      app.process()?.kill('SIGKILL')
    }
  },

  window: async ({ electronApp }, use) => {
    let win
    for (let i = 0; i < 80 && !win; i++) {
      win = electronApp.windows().find((w) => !w.url().startsWith('devtools://'))
      if (!win) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
    }
    if (!win) {
      throw new Error('[e2e] main window did not open in time')
    }
    await win.waitForSelector('.no-task, .task-list', { timeout: 20000 })
    await use(win)
  }
})

export { expect } from '@playwright/test'
