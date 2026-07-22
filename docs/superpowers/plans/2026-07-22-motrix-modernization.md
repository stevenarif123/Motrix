# Motrix Codebase Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modernize the Motrix build architecture by replacing legacy Webpack/`.electron-vue` with `electron-vite`, upgrading Electron, and preparing Vue 2.7 components for composition API.

**Architecture:** We configure `electron.vite.config.js` to manage Main, Preload, and Renderer processes via Vite. We update `package.json` scripts to use `electron-vite dev` and `electron-vite build`, ensuring fast HMR during development and clean packaging with `electron-builder`.

**Tech Stack:** Node.js, Electron 28+, `electron-vite`, Vite, Vue 2.7.14 (`@vitejs/plugin-vue2`), Element UI, ESLint.

## Global Constraints

- Preserve existing `aria2` engine binary execution, WebSocket RPC communication, and task management logic.
- Keep Vue 2.7.14 compatibility without breaking existing Element UI components.

---

### Task 1: Install `electron-vite` and Vite Dependencies

**Files:**
- Modify: [package.json](file:///d:/WEB/Motrix/package.json)

**Interfaces:**
- Consumes: Existing npm dependencies
- Produces: `electron-vite`, `vite`, and `@vitejs/plugin-vue2` in `devDependencies`

- [ ] **Step 1: Install electron-vite, vite, and @vitejs/plugin-vue2**

Run command to install modern dev dependencies:
```bash
npm install -D electron-vite vite @vitejs/plugin-vue2
```

- [ ] **Step 2: Verify installation in package.json**

Inspect `package.json` to confirm `electron-vite`, `vite`, and `@vitejs/plugin-vue2` are present under `devDependencies`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json yarn.lock
git commit -m "build: install electron-vite and vite vue2 plugin"
```

---

### Task 2: Create `electron.vite.config.js` Configuration

**Files:**
- Create: [electron.vite.config.js](file:///d:/WEB/Motrix/electron.vite.config.js)

**Interfaces:**
- Consumes: `electron-vite` config helper `defineConfig`, `@vitejs/plugin-vue2`
- Produces: Vite build configuration for main (`src/main/index.js`), preload (`src/preload/index.js`), and renderer (`src/renderer/index.html`)

- [ ] **Step 1: Create `electron.vite.config.js`**

Create `electron.vite.config.js` with the following content:
```javascript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue2'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/main/index.js')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/preload/index.js')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
        '@shared': resolve(__dirname, 'src/shared')
      }
    },
    plugins: [vue()]
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add electron.vite.config.js
git commit -m "build: add electron.vite.config.js"
```

---

### Task 3: Create Preload Script and Entry HTML

**Files:**
- Create: `src/preload/index.js`
- Create: `src/renderer/index.html`

**Interfaces:**
- Consumes: Electron `contextBridge` and `ipcRenderer`
- Produces: Preload script for safe renderer-main IPC bridge and index.html entry for Vite renderer

- [ ] **Step 1: Create `src/preload/index.js`**

Create `src/preload/index.js`:
```javascript
import { contextBridge, ipcRenderer } from 'electron'

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', {
      ipcRenderer: {
        send: (channel, ...args) => ipcRenderer.send(channel, ...args),
        on: (channel, listener) => ipcRenderer.on(channel, listener),
        once: (channel, listener) => ipcRenderer.once(channel, listener),
        removeListener: (channel, listener) => ipcRenderer.removeListener(channel, listener)
      }
    })
  } catch (error) {
    console.error('Preload script error:', error)
  }
} else {
  window.electron = { ipcRenderer }
}
```

- [ ] **Step 2: Create `src/renderer/index.html`**

Create `src/renderer/index.html`:
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Motrix</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Commit**

```bash
git add src/preload/index.js src/renderer/index.html
git commit -m "feat: add preload script and renderer index.html for electron-vite"
```

---

### Task 4: Update npm scripts in `package.json` and Verify Dev Server

**Files:**
- Modify: [package.json](file:///d:/WEB/Motrix/package.json)

**Interfaces:**
- Consumes: `electron-vite` CLI
- Produces: Updated `npm run dev` and `npm run build` commands

- [ ] **Step 1: Update package.json scripts**

Update `scripts` section in `package.json` to replace `.electron-vue` commands with `electron-vite`:
```json
"dev": "electron-vite dev",
"build": "electron-vite build && electron-builder",
"preview": "electron-vite preview"
```

- [ ] **Step 2: Verify dev server startup**

Run `npm run dev` and verify that `electron-vite` builds main and renderer processes successfully.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "build: update npm scripts to use electron-vite"
```
