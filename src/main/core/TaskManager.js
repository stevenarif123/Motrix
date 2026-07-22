import path from 'node:path'
import fs from 'node:fs'
import { app } from 'electron'
import writeFileAtomic from 'write-file-atomic'
import logger from './Logger'

export default class TaskManager {
  constructor () {
    this.filePath = path.join(app.getPath('userData'), 'download-history.json')
    this.backupPath = path.join(app.getPath('userData'), 'download-history.json.bak')
    this.tasks = new Map()

    this.init()
  }

  init () {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8')
        if (raw && raw.trim().length > 0) {
          const list = JSON.parse(raw)
          if (Array.isArray(list)) {
            list.forEach(t => this.tasks.set(t.id, t))
          }
        } else {
          this.recoverFromBackup()
        }
      } else {
        this.recoverFromBackup()
      }
    } catch (err) {
      logger.error('[Motrix] Error reading download history, attempting backup recovery:', err)
      this.recoverFromBackup()
    }
  }

  recoverFromBackup () {
    try {
      if (fs.existsSync(this.backupPath)) {
        const rawBackup = fs.readFileSync(this.backupPath, 'utf8')
        if (rawBackup && rawBackup.trim().length > 0) {
          const list = JSON.parse(rawBackup)
          if (Array.isArray(list)) {
            list.forEach(t => this.tasks.set(t.id, t))
            logger.info('[Motrix] Successfully recovered download history from backup file.')
            this.save()
          }
        }
      }
    } catch (backupErr) {
      logger.error('[Motrix] Failed to recover download history from backup:', backupErr)
    }
  }

  save () {
    try {
      const dataArray = Array.from(this.tasks.values())
      const jsonString = JSON.stringify(dataArray, null, 2)

      // Atomic write to main history file
      writeFileAtomic.sync(this.filePath, jsonString)

      // Atomic write to backup history file
      writeFileAtomic.sync(this.backupPath, jsonString)
    } catch (err) {
      logger.error('[Motrix] Failed to save download history atomically:', err)
    }
  }

  upsertTask (task) {
    if (!task || !task.id) return

    const existing = this.tasks.get(task.id) || {}
    const updated = {
      ...existing,
      ...task,
      updatedAt: Date.now(),
      createdAt: existing.createdAt || Date.now()
    }

    this.tasks.set(task.id, updated)
    this.save()
  }

  getTasks (statusFilter = null) {
    const list = Array.from(this.tasks.values())
    if (statusFilter) {
      return list.filter(t => t.status === statusFilter)
    }
    return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
  }

  deleteTask (id) {
    if (!id) return
    this.tasks.delete(id)
    this.save()
  }
}
