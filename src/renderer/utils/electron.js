// Everything the renderer needs from Electron goes through the preload bridge.
const bridge = window.electron || {}

export const ipcRenderer = bridge.ipcRenderer

const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

export const dialog = {
  showOpenDialog: (options) => invoke('dialog:show-open-dialog', options),
  showMessageBox: (options) => invoke('dialog:show-message-box', options)
}

export const shell = {
  showItemInFolder: (path) => invoke('shell:show-item-in-folder', path),
  openPath: (path) => invoke('shell:open-path', path),
  trashTaskFiles: (options) => invoke('shell:trash-task-files', options)
}

export const clipboard = {
  readText: () => invoke('clipboard:read-text')
}

export const currentWindow = {
  minimize: () => invoke('window:minimize'),
  toggleMaximize: () => invoke('window:toggle-maximize'),
  close: () => invoke('window:close')
}

export const getAppInfo = () => invoke('app:get-info')

export const parseTorrent = (arrayBuffer) => invoke('torrent:parse', arrayBuffer)

export default {
  ipcRenderer,
  clipboard
}
