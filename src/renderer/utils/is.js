// Renderer replacement for electron-is: the sandboxed page has no `process`.
const { platform = '', isMas = false } = (typeof window !== 'undefined' && window.electron) || {}

export default {
  renderer: () => !!platform,
  main: () => false,
  osx: () => platform === 'darwin',
  macOS: () => platform === 'darwin',
  windows: () => platform === 'win32',
  linux: () => platform === 'linux',
  mas: () => isMas,
  dev: () => import.meta.env.DEV,
  production: () => import.meta.env.PROD
}
