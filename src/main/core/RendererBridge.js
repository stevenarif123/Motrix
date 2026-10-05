import { access } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { app, BrowserWindow, clipboard, dialog, ipcMain, shell } from 'electron'
import parseTorrent from 'parse-torrent'

import logger from './Logger'

const exists = async (path) => {
  try {
    await access(path)
    return true
  } catch (err) {
    return false
  }
}

const isInside = (dir, target) => {
  const rel = relative(resolve(dir), resolve(target))
  return !!rel && !rel.startsWith('..') && !isAbsolute(rel)
}

const trashIfExists = async (path) => {
  if (!(await exists(path))) {
    return true
  }
  try {
    await shell.trashItem(path)
    return true
  } catch (err) {
    logger.warn(`[Motrix] move to trash failed: ${path}`, err.message)
    return false
  }
}

const senderWindow = (event) => BrowserWindow.fromWebContents(event.sender)

export const setupRendererBridge = () => {
  ipcMain.handle('app:get-info', () => ({
    name: app.getName(),
    version: app.getVersion()
  }))

  ipcMain.handle('dialog:show-open-dialog', (_event, options) => dialog.showOpenDialog(options))

  ipcMain.handle('dialog:show-message-box', (_event, options) => dialog.showMessageBox(options))

  ipcMain.handle('shell:show-item-in-folder', async (_event, path) => {
    if (!path) {
      return false
    }
    const fullPath = resolve(path)
    if (!(await exists(fullPath))) {
      return false
    }
    shell.showItemInFolder(fullPath)
    return true
  })

  ipcMain.handle('shell:open-path', (_event, path) => shell.openPath(resolve(path)))

  // The renderer only names a task; the containment check lives here so a
  // compromised page cannot trash arbitrary paths.
  ipcMain.handle('shell:trash-task-files', async (_event, { dir, path, withControlFile }) => {
    if (!dir || !path || !isInside(dir, path)) {
      throw new Error('task.file-path-error')
    }
    const fullPath = resolve(path)
    const results = [await trashIfExists(fullPath)]
    if (withControlFile) {
      results.push(await trashIfExists(`${fullPath}.aria2`))
    }
    return results.every(Boolean)
  })

  ipcMain.handle('clipboard:read-text', () => clipboard.readText())

  ipcMain.handle('window:minimize', (event) => senderWindow(event)?.minimize())

  ipcMain.handle('window:toggle-maximize', (event) => {
    const win = senderWindow(event)
    if (!win) {
      return
    }
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  })

  ipcMain.handle('window:close', (event) => senderWindow(event)?.close())

  ipcMain.handle('torrent:parse', (_event, data) => {
    const torrent = parseTorrent(Buffer.from(data))
    return {
      name: torrent.name,
      files: (torrent.files || []).map(({ name, path, length, offset }) => ({ name, path, length, offset }))
    }
  })
}
