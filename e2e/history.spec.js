import { test, expect } from './fixtures.js'

test('records completed and failed downloads, and search/remove work', async ({ window, server }) => {
  await window.evaluate(() => window.app.$store.dispatch('app/showAddTaskDialog', 'uri'))
  await window.waitForSelector('.add-task-dialog textarea', { state: 'visible' })

  const urls = [server.asset('sample.mp4'), server.asset('does-not-exist.zip')]
  await window.fill('.add-task-dialog textarea', urls.join('\n'))
  await window.click('.add-task-dialog .dialog-footer .el-button--primary')

  // A 404 is retried by aria2 before it's reported as an error.
  await expect
    .poll(async () => (await window.evaluate(() => window.electron.ipcRenderer.invoke('history:list', {}))).total, { timeout: 20000 })
    .toBe(2)

  await window.evaluate(() => { window.app.$router.push('/history').catch(() => {}); return 1 })
  await window.waitForSelector('.history-item', { timeout: 10000 })

  const rows = await window.locator('.history-item').allInnerTexts()
  expect(rows.some((row) => row.includes('sample.mp4') && row.includes('Complete'))).toBe(true)
  expect(rows.some((row) => row.includes('does-not-exist.zip') && row.includes('Error'))).toBe(true)

  await window.fill('.history-search input', 'sample')
  await expect(window.locator('.history-item')).toHaveCount(1, { timeout: 5000 })
  await window.fill('.history-search input', '')
  await expect(window.locator('.history-item')).toHaveCount(2, { timeout: 5000 })

  await window.locator('.history-item', { hasText: 'does-not-exist.zip' }).locator('.history-item-actions i').last().click()
  await expect(window.locator('.history-item')).toHaveCount(1, { timeout: 5000 })

  const { total } = await window.evaluate(() => window.electron.ipcRenderer.invoke('history:list', {}))
  expect(total).toBe(1)
})
