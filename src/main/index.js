import { join } from 'node:path'
import { app } from 'electron'
import is from 'electron-is'
import { initialize } from '@electron/remote/main'

import Launcher from './Launcher'

/**
 * initialize the main-process side of the remote module
 */
initialize()

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'

// Vite copies static/ into the renderer output; the dev server serves it from the repo.
global.__static = process.env.ELECTRON_RENDERER_URL
  ? join(__dirname, '../../static')
  : join(__dirname, '../renderer')

// Must match appId in electron-builder.json for Windows notifications
const appId = 'app.motrix.native'
if (is.windows()) {
  app.setAppUserModelId(appId)
}

global.launcher = new Launcher()
