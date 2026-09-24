import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { app } from 'electron'

import { IS_PORTABLE } from '@shared/constants'
import logger from './Logger'

const COPIED_FILES = ['user.json', 'system.json', 'dht.dat', 'dht6.dat']
const DHT_PATH_KEYS = ['dht-file-path', 'dht-file-path6']

export const getLegacyUserDataPath = () => join(app.getPath('appData'), 'Motrix')

/**
 * Copies settings from an upstream Motrix install into this fork's own
 * user-data folder, the first time this fork runs. The download session is
 * deliberately left behind: if the old app is still installed, both would
 * resume writing the same in-progress files.
 *
 * Pure filesystem function so it can be unit-tested without Electron.
 */
export const migrateLegacyUserData = ({ fromDir, toDir }) => {
  const legacyUserConfig = join(fromDir, 'user.json')
  if (!existsSync(legacyUserConfig) || existsSync(join(toDir, 'user.json'))) {
    return false
  }

  mkdirSync(toDir, { recursive: true })

  COPIED_FILES.forEach((name) => {
    const from = join(fromDir, name)
    if (existsSync(from)) {
      copyFileSync(from, join(toDir, name))
    }
  })

  const systemConfigPath = join(toDir, 'system.json')
  if (existsSync(systemConfigPath)) {
    const system = JSON.parse(readFileSync(systemConfigPath, 'utf8'))
    let changed = false

    DHT_PATH_KEYS.forEach((key) => {
      const value = system[key]
      if (typeof value === 'string' && value.startsWith(fromDir)) {
        system[key] = join(toDir, relative(fromDir, value))
        changed = true
      }
    })

    if (changed) {
      writeFileSync(systemConfigPath, JSON.stringify(system, null, 2))
    }
  }

  return true
}

export const runMigration = (toDir) => {
  if (IS_PORTABLE) {
    return
  }

  const fromDir = getLegacyUserDataPath()
  if (fromDir === toDir) {
    return
  }

  try {
    if (migrateLegacyUserData({ fromDir, toDir })) {
      logger.info(`[Motrix] migrated settings from legacy install: ${fromDir} -> ${toDir}`)
    }
  } catch (err) {
    logger.warn('[Motrix] settings migration failed:', err.message)
  }
}
