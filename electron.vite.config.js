import { resolve } from 'path'
import { builtinModules, createRequire } from 'module'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue2'

const nodeRequire = createRequire(resolve(__dirname, 'package.json'))

const ELECTRON_RENDERER_EXPORTS = [
  'clipboard',
  'contextBridge',
  'crashReporter',
  'ipcRenderer',
  'nativeImage',
  'shell',
  'webFrame'
]

// The renderer runs with nodeIntegration, so `electron` and Node built-ins
// must be loaded through the runtime `require` instead of Vite's browser stubs.
function rendererNodeIntegration () {
  const PREFIX = '\0renderer-node:'
  const nodeModules = new Set([
    'electron',
    ...builtinModules,
    ...builtinModules.map((name) => `node:${name}`)
  ])
  const isIdentifier = (key) => /^[A-Za-z_$][\w$]*$/.test(key) && key !== 'default'

  return {
    name: 'motrix:renderer-node-integration',
    enforce: 'pre',
    resolveId (id) {
      if (nodeModules.has(id)) {
        return PREFIX + id
      }
    },
    load (id) {
      if (!id.startsWith(PREFIX)) {
        return
      }
      const name = id.slice(PREFIX.length)
      const keys = name === 'electron'
        ? ELECTRON_RENDERER_EXPORTS
        : Object.keys(nodeRequire(name)).filter(isIdentifier)
      return [
        `const mod = globalThis.require(${JSON.stringify(name)})`,
        'export default mod',
        ...keys.map((key) => `export const ${key} = mod.${key}`)
      ].join('\n')
    }
  }
}

export default defineConfig({
  main: {
    define: {
      __static: 'global.__static'
    },
    plugins: [
      externalizeDepsPlugin()
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/main/index.js')
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/main'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/preload/index.js')
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/preload'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    publicDir: resolve(__dirname, 'static'),
    build: {
      rollupOptions: {
        input: resolve(__dirname, 'src/renderer/index.html')
      }
    },
    optimizeDeps: {
      rolldownOptions: {
        plugins: [rendererNodeIntegration()]
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "${resolve(__dirname, 'src/renderer/components/Theme/Variables.scss').replace(/\\/g, '/')}";\n`
        }
      }
    },
    resolve: {
      alias: {
        'static': resolve(__dirname, 'static'),
        '~normalize.css': resolve(__dirname, 'node_modules/normalize.css'),
        '~element-ui': resolve(__dirname, 'node_modules/element-ui'),
        '~@': resolve(__dirname, 'src/renderer'),
        '~': resolve(__dirname, 'node_modules'),
        '@': resolve(__dirname, 'src/renderer'),
        '@shared': resolve(__dirname, 'src/shared')
      },
      extensions: ['.js', '.vue', '.json', '.scss']
    },
    plugins: [rendererNodeIntegration(), vue()]
  }
})
