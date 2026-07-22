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
    url: is.dev() ? (process.env.ELECTRON_RENDERER_URL || 'http://localhost:5173') : require('path').join('file://', __dirname, '../renderer/index.html')
  }
}
