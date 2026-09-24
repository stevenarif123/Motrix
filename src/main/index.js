import { join } from 'node:path'
import { app } from 'electron'
import is from 'electron-is'

import Launcher from './Launcher'
import { runMigration } from './core/Migration'
import { getUserDataPath } from './utils/index'

// Vite copies static/ into the renderer output; the dev server serves it from the repo.
global.__static = process.env.ELECTRON_RENDERER_URL
  ? join(__dirname, '../../static')
  : join(__dirname, '../renderer')

// Must match appId in electron-builder.json for Windows notifications
const appId = 'io.github.stevenarif123.motrix-modernized'
if (is.windows()) {
  app.setAppUserModelId(appId)
}

// Must run before ConfigManager (created inside Application, via Launcher) reads its stores.
runMigration(getUserDataPath())

global.launcher = new Launcher()
