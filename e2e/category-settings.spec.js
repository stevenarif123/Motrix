import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from './fixtures.js'

test('a custom category folder name is saved and used for new downloads', async ({ window, server }) => {
  const config = await window.evaluate(() => window.electron.ipcRenderer.invoke('get-app-config'))
  const baseDir = config.dir

  await window.evaluate(() => { window.app.$router.push('/preference/basic').catch(() => {}); return 1 })
  await window.waitForSelector('.category-settings', { timeout: 10000 })

  await window.fill('.category-row:nth-child(1) .category-folder-input input', 'Films')
  await window.locator('.category-row:nth-child(1) .category-extensions-input input').blur()
  await window.click('.form-actions button:has-text("Save")')
  await window.waitForTimeout(500)

  await window.evaluate(() => window.app.$store.dispatch('app/showAddTaskDialog', 'uri'))
  await window.waitForSelector('.add-task-dialog textarea', { state: 'visible' })
  await window.fill('.add-task-dialog textarea', server.asset('sample.mp4'))
  await window.click('.add-task-dialog .dialog-footer .el-button--primary')

  await expect.poll(() => existsSync(join(baseDir, 'Films', 'sample.mp4')), { timeout: 15000 }).toBe(true)
})

test('turning off automatic categorization leaves downloads in the base directory', async ({ window, server }) => {
  const config = await window.evaluate(() => window.electron.ipcRenderer.invoke('get-app-config'))
  const baseDir = config.dir

  await window.evaluate(() => { window.app.$router.push('/preference/basic').catch(() => {}); return 1 })
  await window.waitForSelector('.category-settings', { timeout: 10000 })
  await window.locator('.el-checkbox', { hasText: 'Automatically sort downloads' }).click()
  await expect(window.locator('.category-row')).toHaveCount(0)
  await window.click('.form-actions button:has-text("Save")')
  await window.waitForTimeout(500)

  await window.evaluate(() => window.app.$store.dispatch('app/showAddTaskDialog', 'uri'))
  await window.waitForSelector('.add-task-dialog textarea', { state: 'visible' })
  await window.fill('.add-task-dialog textarea', server.asset('sample.mp4'))
  await window.click('.add-task-dialog .dialog-footer .el-button--primary')

  await expect.poll(() => existsSync(join(baseDir, 'sample.mp4')), { timeout: 15000 }).toBe(true)
  expect(existsSync(join(baseDir, 'Videos', 'sample.mp4'))).toBe(false)
})
