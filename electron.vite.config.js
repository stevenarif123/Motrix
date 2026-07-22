import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue2'
import rendererPlugin from 'vite-plugin-electron-renderer'

export default defineConfig({
  main: {
    define: {
      __static: 'global.__static'
    },
    plugins: [
      externalizeDepsPlugin()
    ],
    build: {
      rollupOptions: {
        external: [
          'electron',
          'write-file-atomic',
          'ws',
          'electron-store',
          'electron-log',
          'electron-is',
          'electron-updater',
          '@motrix/nat-api',
          '@motrix/multispinner'
        ]
      },
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
        '@shared': resolve(__dirname, 'src/shared'),
        'vue$': 'vue/dist/vue.esm.js'
      },
      extensions: ['.js', '.vue', '.json', '.scss']
    },
    plugins: [
      vue(),
      rendererPlugin()
    ]
  }
})
