import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import writeFileAtomic from 'write-file-atomic'

import { getUserDataPath } from '../utils/index'
import logger from './Logger'

const MAX_ENTRIES = 5000
const SAVE_DEBOUNCE_MS = 1000

const readEntries = (filePath) => {
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const raw = readFileSync(filePath, 'utf8')
    if (!raw || !raw.trim()) {
      return null
    }
    const list = JSON.parse(raw)
    return Array.isArray(list) ? list : null
  } catch (err) {
    return null
  }
}

export default class HistoryManager {
  constructor (options = {}) {
    const baseDir = options.baseDir || getUserDataPath()
    this.filePath = join(baseDir, 'download-history.json')
    this.backupPath = `${this.filePath}.bak`
    this.entries = new Map()
    this.saveTimer = null

    this.load()
  }

  load () {
    let list = readEntries(this.filePath)
    if (!list) {
      list = readEntries(this.backupPath)
      if (list) {
        logger.warn('[Motrix] download history was corrupt, recovered from backup')
      }
    }

    const safeList = list || []
    safeList.forEach((entry) => {
      if (entry && entry.id) {
        this.entries.set(entry.id, entry)
      }
    })
  }

  saveNow () {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }

    try {
      const json = JSON.stringify([...this.entries.values()], null, 2)
      writeFileAtomic.sync(this.filePath, json)
      writeFileAtomic.sync(this.backupPath, json)
    } catch (err) {
      logger.error('[Motrix] failed to save download history:', err.message)
    }
  }

  scheduleSave () {
    if (this.saveTimer) {
      return
    }
    this.saveTimer = setTimeout(() => this.saveNow(), SAVE_DEBOUNCE_MS)
  }

  // Flushes a pending debounced save immediately; call before the app quits.
  flush () {
    if (this.saveTimer) {
      this.saveNow()
    }
  }

  record (entry) {
    if (!entry || !entry.id) {
      return
    }

    this.entries.set(entry.id, { ...entry })
    this.evictOldest()
    this.scheduleSave()
  }

  evictOldest () {
    if (this.entries.size <= MAX_ENTRIES) {
      return
    }

    const overflow = this.entries.size - MAX_ENTRIES
    const oldestIds = [...this.entries.values()]
      .sort((a, b) => (a.finishedAt || 0) - (b.finishedAt || 0))
      .slice(0, overflow)
      .map((entry) => entry.id)

    oldestIds.forEach((id) => this.entries.delete(id))
  }

  list ({ query = '', category = '', status = '', offset = 0, limit = 100 } = {}) {
    const q = query.trim().toLowerCase()
    const matches = [...this.entries.values()]
      .filter((entry) => !category || entry.category === category)
      .filter((entry) => !status || entry.status === status)
      .filter((entry) => !q || (entry.name || '').toLowerCase().includes(q))
      .sort((a, b) => (b.finishedAt || 0) - (a.finishedAt || 0))

    return {
      total: matches.length,
      items: matches.slice(offset, offset + limit)
    }
  }

  remove (ids = []) {
    ids.forEach((id) => this.entries.delete(id))
    this.scheduleSave()
  }

  clear () {
    this.entries.clear()
    this.scheduleSave()
  }
}
