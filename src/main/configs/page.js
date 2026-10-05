import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import is from 'electron-is'

export default {
  index: {
    attrs: {
      title: 'Motrix',
      width: 1024,
      height: 768,
      minWidth: 478,
      minHeight: 420,
      transparent: is.macOS()
    },
    bindCloseToHide: true,
    openDevTools: is.dev(),
    url: process.env.ELECTRON_RENDERER_URL ||
      pathToFileURL(join(__dirname, '../renderer/index.html')).href
  }
}
