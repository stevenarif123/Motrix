import { test, expect } from './fixtures.js'

test.describe('renderer isolation', () => {
  test('has no Node.js access and only allowlisted IPC channels', async ({ window }) => {
    const info = await window.evaluate(() => ({
      require: typeof require,
      process: typeof process,
      bridgeKeys: Object.keys(window.electron || {}),
      ipcKeys: Object.keys((window.electron || {}).ipcRenderer || {})
    }))

    expect(info.require).toBe('undefined')
    expect(info.process).toBe('undefined')
    expect(info.bridgeKeys).toEqual(expect.arrayContaining(['ipcRenderer', 'platform']))
    expect(info.ipcKeys).toEqual(expect.arrayContaining(['send', 'invoke', 'on', 'removeListener']))
  })

  test('rejects an unregistered IPC channel', async ({ window }) => {
    const result = await window.evaluate(() => {
      try {
        window.electron.ipcRenderer.invoke('evil-channel')
        return 'allowed'
      } catch (err) {
        return `rejected: ${err.message}`
      }
    })

    expect(result).toContain('rejected')
    expect(result).toContain('evil-channel')
  })

  test('refuses to trash a file outside the task directory', async ({ window }) => {
    const outcome = await window.evaluate(() =>
      window.electron.ipcRenderer
        .invoke('shell:trash-task-files', { dir: '/tmp/some-download-dir', path: '/etc/passwd' })
        .then(() => 'allowed')
        .catch(() => 'rejected')
    )

    expect(outcome).toBe('rejected')
  })
})
