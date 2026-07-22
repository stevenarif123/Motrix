import { contextBridge, ipcRenderer } from 'electron'

// Electron 28 compatibility shim for @electron/remote
try {
  const features = process.electronBinding('features')
  if (features && typeof features.isDesktopCapturerEnabled !== 'function') {
    features.isDesktopCapturerEnabled = () => true
  }
} catch (e) {}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, listener) => ipcRenderer.on(channel, listener),
        once: (channel, listener) => ipcRenderer.once(channel, listener),
        removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener)
      }
    })
  } catch (error) {
    console.error('Preload script error:', error)
  }
} else {
  window.electron = { ipcRenderer }
}
