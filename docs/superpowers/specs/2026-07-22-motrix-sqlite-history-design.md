# Motrix SQLite Task & History Persistence Design

**Date:** 2026-07-22  
**Status:** Approved  
**Author:** Antigravity AI & Developer  

---

## 1. Problem Statement

Motrix previously relied on `aria2.session` text files and `electron-store` JSON files for task and history persistence. If the process is terminated abruptly (system crash, forced close, power failure), unwritten buffers lead to corrupted or empty state files, causing users to lose their download history.

---

## 2. Technical Solution: SQLite + WAL Mode + Aria2 Session Autosave

To guarantee 100% data durability and zero history loss, we introduce a dual-layer persistence system:

### A. Database Layer (`better-sqlite3` with WAL mode)
* Uses `better-sqlite3` in the Electron Main process.
* Enables Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and immediate synchronization (`PRAGMA synchronous = NORMAL;`).
* Creates a resilient SQLite database file (`history.db`) in Motrix user data directory.

### B. Aria2 Engine Layer (`--save-session-interval=30`)
* Adds `--save-session-interval=30` to `aria2c` engine spawn arguments.
* Ensures `aria2c` automatically dumps session state every 30 seconds rather than only on clean exit.

---

## 3. Database Schema

### Table: `tasks`
```sql
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,            -- GID or task UUID
  name TEXT NOT NULL,             -- File name
  url TEXT,                       -- Source URL / Magnet / Torrent path
  dir TEXT NOT NULL,              -- Download directory path
  status TEXT NOT NULL,           -- 'active', 'waiting', 'paused', 'complete', 'error', 'removed'
  total_length INTEGER DEFAULT 0, -- File size in bytes
  completed_length INTEGER DEFAULT 0, -- Bytes downloaded
  download_speed INTEGER DEFAULT 0,
  upload_speed INTEGER DEFAULT 0,
  category TEXT DEFAULT 'other',  -- 'video', 'audio', 'document', 'compressed', 'application', 'other'
  created_at INTEGER NOT NULL,    -- Timestamp (ms)
  updated_at INTEGER NOT NULL     -- Timestamp (ms)
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON tasks(created_at DESC);
```

---

## 4. Architecture & IPC Flow

```
+------------------+       IPC (invoke/send)       +---------------------+
|  Vue 2.7 UI      |  <------------------------->  | Electron Main       |
|  (Renderer)      |                               | TaskHistoryManager  |
+------------------+                               +----------+----------+
                                                              |
                                                    SQLite (better-sqlite3)
                                                              |
                                                              v
                                                    %APPDATA%/Motrix/history.db
```

---

## 5. Implementation Roadmap

1. **Task 1: Install `better-sqlite3`** and configure native build support for Electron.
2. **Task 2: Create `DatabaseManager.js`** in `src/main/core/` to initialize `history.db`, WAL mode, and migrations.
3. **Task 3: Add `save-session-interval=30`** to `src/main/core/Engine.js`.
4. **Task 4: Integrate Task Manager IPCs** between main process and Vue renderer.
