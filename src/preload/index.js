import { contextBridge, ipcRenderer } from 'electron'

const SEND_CHANNELS = ['command', 'event']
const RECEIVE_CHANNELS = ['command']
const INVOKE_CHANNELS = [
  'get-app-config',
  'app:get-info',
  'dialog:show-open-dialog',
  'dialog:show-message-box',
  'shell:show-item-in-folder',
  'shell:open-path',
  'shell:trash-task-files',
  'clipboard:read-text',
  'window:minimize',
  'window:toggle-maximize',
  'window:close',
  'torrent:parse'
]

const assertChannel = (list, channel) => {
  if (!list.includes(channel)) {
    throw new Error(`[Motrix] IPC channel not allowed: ${channel}`)
  }
}

// Listeners are wrapped so the renderer never receives the raw IpcRendererEvent.
const wrappedListeners = new Map()

contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isMas: !!process.mas,
  ipcRenderer: {
    send (channel, ...args) {
      assertChannel(SEND_CHANNELS, channel)
      ipcRenderer.send(channel, ...args)
    },
    invoke (channel, ...args) {
      assertChannel(INVOKE_CHANNELS, channel)
      return ipcRenderer.invoke(channel, ...args)
    },
    on (channel, listener) {
      assertChannel(RECEIVE_CHANNELS, channel)
      const wrapped = (_event, ...args) => listener({}, ...args)
      wrappedListeners.set(listener, wrapped)
      ipcRenderer.on(channel, wrapped)
    },
    removeListener (channel, listener) {
      assertChannel(RECEIVE_CHANNELS, channel)
      const wrapped = wrappedListeners.get(listener)
      if (wrapped) {
        ipcRenderer.removeListener(channel, wrapped)
        wrappedListeners.delete(listener)
      }
    },
    removeAllListeners (channel) {
      assertChannel(RECEIVE_CHANNELS, channel)
      ipcRenderer.removeAllListeners(channel)
    }
  }
})
