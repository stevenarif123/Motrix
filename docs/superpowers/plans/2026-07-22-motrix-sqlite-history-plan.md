# Motrix SQLite Task & History Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement SQLite database storage (`better-sqlite3`) in Motrix Main process with WAL mode and aria2 `--save-session-interval=30` to prevent download history loss.

**Architecture:** A `DatabaseManager` class initializes `%APPDATA%/Motrix/history.db` with SQLite WAL mode and manages CRUD operations for tasks. `Engine.js` is updated to include `--save-session-interval=30` for aria2.

**Tech Stack:** Node.js, Electron, `better-sqlite3`, SQLite 3, JavaScript ES Modules.

## Global Constraints

- Must run natively within Electron main process.
- Database must automatically create tables on first launch.
- `aria2.session` autosave must be enabled alongside SQLite.

---

### Task 1: Install `better-sqlite3` and Configure Native Module Build

**Files:**
- Modify: [package.json](file:///d:/WEB/Motrix/package.json)

**Interfaces:**
- Consumes: `npm install better-sqlite3`
- Produces: `better-sqlite3` native dependency

- [ ] **Step 1: Install better-sqlite3**

Run:
```bash
npm install better-sqlite3 --legacy-peer-deps
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add better-sqlite3 for task persistence"
```

---

### Task 2: Create `DatabaseManager.js` in `src/main/core/`

**Files:**
- Create: [src/main/core/DatabaseManager.js](file:///d:/WEB/Motrix/src/main/core/DatabaseManager.js)

**Interfaces:**
- Consumes: `better-sqlite3`, `app.getPath('userData')`
- Produces: `DatabaseManager` instance with methods `init()`, `upsertTask(task)`, `getTasks()`, `deleteTask(id)`

- [ ] **Step 1: Create DatabaseManager.js**

Create `src/main/core/DatabaseManager.js`:
```javascript
import path from 'node:path'
import { app } from 'electron'
import Database from 'better-sqlite3'
import logger from './Logger'

export default class DatabaseManager {
  constructor () {
    this.db = null
    this.init()
  }

  init () {
    try {
      const dbPath = path.join(app.getPath('userData'), 'history.db')
      logger.info('[Motrix] Initializing SQLite Database at:', dbPath)

      this.db = new Database(dbPath)
      this.db.pragma('journal_mode = WAL')
      this.db.pragma('synchronous = NORMAL')

      this.createTables()
    } catch (err) {
      logger.error('[Motrix] SQLite Database init error:', err)
    }
  }

  createTables () {
    const sql = `
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT,
        dir TEXT NOT NULL,
        status TEXT NOT NULL,
        total_length INTEGER DEFAULT 0,
        completed_length INTEGER DEFAULT 0,
        download_speed INTEGER DEFAULT 0,
        upload_speed INTEGER DEFAULT 0,
        category TEXT DEFAULT 'other',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
    `
    this.db.exec(sql)
  }

  upsertTask (task) {
    if (!this.db || !task || !task.id) return

    const stmt = this.db.prepare(`
      INSERT INTO tasks (id, name, url, dir, status, total_length, completed_length, download_speed, upload_speed, category, created_at, updated_at)
      VALUES (@id, @name, @url, @dir, @status, @total_length, @completed_length, @download_speed, @upload_speed, @category, @created_at, @updated_at)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        status = excluded.status,
        total_length = excluded.total_length,
        completed_length = excluded.completed_length,
        download_speed = excluded.download_speed,
        upload_speed = excluded.upload_speed,
        updated_at = excluded.updated_at
    `)

    const now = Date.now()
    stmt.run({
      id: task.id,
      name: task.name || 'Untitled',
      url: task.url || '',
      dir: task.dir || '',
      status: task.status || 'waiting',
      total_length: task.totalLength || 0,
      completed_length: task.completedLength || 0,
      download_speed: task.downloadSpeed || 0,
      upload_speed: task.uploadSpeed || 0,
      category: task.category || 'other',
      created_at: task.createdAt || now,
      updated_at: now
    })
  }

  getTasks (statusFilter = null) {
    if (!this.db) return []

    if (statusFilter) {
      const stmt = this.db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC')
      return stmt.all(statusFilter)
    }

    const stmt = this.db.prepare('SELECT * FROM tasks ORDER BY created_at DESC')
    return stmt.all()
  }

  deleteTask (id) {
    if (!this.db || !id) return
    const stmt = this.db.prepare('DELETE FROM tasks WHERE id = ?')
    stmt.run(id)
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/main/core/DatabaseManager.js
git commit -m "feat: add DatabaseManager with SQLite WAL mode"
```

---

### Task 3: Add `save-session-interval=30` to `Engine.js`

**Files:**
- Modify: [src/main/core/Engine.js](file:///d:/WEB/Motrix/src/main/core/Engine.js)

**Interfaces:**
- Consumes: `aria2c` start args in `getStartArgs()`
- Produces: `--save-session-interval=30` argument passed to aria2 daemon

- [ ] **Step 1: Update Engine.js**

In `src/main/core/Engine.js`, update `getStartArgs()` to include `--save-session-interval=30` and `--force-save=true`.

- [ ] **Step 2: Commit**

```bash
git add src/main/core/Engine.js
git commit -m "fix: add save-session-interval=30 and force-save to Engine args"
```
