import { readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from './fixtures.js'

const assetsDir = resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets')

test('downloads route into category subfolders with no leftover .aria2 files', async ({ window, server }) => {
  const config = await window.evaluate(() => window.electron.ipcRenderer.invoke('get-app-config'))
  const baseDir = config.dir

  await window.evaluate(() => window.app.$store.dispatch('app/showAddTaskDialog', 'uri'))
  await window.waitForSelector('.add-task-dialog textarea', { state: 'visible' })

  const urls = ['sample.mp4', 'sample.mp3', 'sample.bin'].map((name) => server.asset(name))
  await window.fill('.add-task-dialog textarea', urls.join('\n'))
  await window.click('.add-task-dialog .dialog-footer .el-button--primary')

  const videoPath = join(baseDir, 'Videos', 'sample.mp4')
  const audioPath = join(baseDir, 'Audio', 'sample.mp3')
  const otherPath = join(baseDir, 'sample.bin')

  await expect.poll(() => existsSync(videoPath), { timeout: 15000 }).toBe(true)
  await expect.poll(() => existsSync(audioPath), { timeout: 15000 }).toBe(true)
  await expect.poll(() => existsSync(otherPath), { timeout: 15000 }).toBe(true)

  // aria2's control files are only removed once the download is fully verified as complete.
  await expect.poll(() => existsSync(`${videoPath}.aria2`), { timeout: 15000 }).toBe(false)
  await expect.poll(() => existsSync(`${audioPath}.aria2`), { timeout: 15000 }).toBe(false)
  await expect.poll(() => existsSync(`${otherPath}.aria2`), { timeout: 15000 }).toBe(false)

  expect(readFileSync(videoPath).equals(readFileSync(join(assetsDir, 'sample.mp4')))).toBe(true)
  expect(readFileSync(audioPath).equals(readFileSync(join(assetsDir, 'sample.mp3')))).toBe(true)
  expect(readFileSync(otherPath).equals(readFileSync(join(assetsDir, 'sample.bin')))).toBe(true)
})
