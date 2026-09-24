import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from './fixtures.js'

const torrentPath = resolve(fileURLToPath(new URL('.', import.meta.url)), 'assets/sample.torrent')

test('parses a dropped .torrent file and lists its contents', async ({ window }) => {
  const bytes = [...readFileSync(torrentPath)]

  await window.evaluate((bytes) => {
    const file = new File([new Uint8Array(bytes)], 'sample.torrent', { type: 'application/x-bittorrent' })
    window.app.$store.dispatch('app/showAddTaskDialog', 'torrent')
    setTimeout(() => window.app.$store.dispatch('app/addTaskAddTorrents', { fileList: [{ raw: file, name: file.name, uid: 1 }] }), 200)
  }, bytes)

  await expect(window.locator('.add-task-dialog .el-table__body tr')).toHaveCount(2, { timeout: 10000 })

  const rows = await window.locator('.add-task-dialog .el-table__body tr').allInnerTexts()
  expect(rows.join(' ')).toContain('intro.mp3')
  expect(rows.join(' ')).toContain('cover.jpg')
})
