# Motrix Codebase Modernization Design

**Date:** 2026-07-22  
**Status:** Approved  
**Author:** Antigravity AI & Developer  

---

## 1. Overview & Objectives

Motrix is a full-featured download manager desktop application built with Electron, Vue 2, Element UI, and an `aria2` core engine.  
The current codebase uses legacy Webpack scripts (`.electron-vue`), Electron 22.3.9, and Vue 2.7.14 with Vuex.

The goal of this modernization effort is to:
1. Replace the slow Webpack build system (`.electron-vue/`) with **`electron-vite`** for fast development HMR and clean builds.
2. Upgrade Electron to a modern stable version (v28+ / v30+).
3. Establish a standard `contextBridge` IPC preload architecture.
4. Prepare components for Vue 3 and Pinia by leveraging Vue 2.7's native Composition API features.

---

## 2. Target System Architecture

```
Motrix Root
├── electron.vite.config.js     # Unified Vite config for Main, Preload, and Renderer
├── src/
│   ├── main/                    # Electron Main Process (Main window, aria2 manager, tray, IPC)
│   ├── preload/                 # Preload scripts (ContextBridge IPC isolation)
│   ├── renderer/                # Vue 2.7 UI (Components, Vuex store, Router, Assets)
│   └── shared/                  # Shared utilities & constants
```

### Key Technical Decisions
* **Build Engine:** `electron-vite` (powered by Vite 4/5 and Rollup).
* **Framework:** Vue 2.7.14 with `@vitejs/plugin-vue2`.
* **IPC Security:** `contextBridge` in `src/preload/index.js` separating renderer from Node.js primitives.
* **Electron:** Upgrade from `22.3.9` to modern stable release.

---

## 3. Phased Modernization Plan

### Phase 1: Build System Migration (`electron-vite`)
* Install `electron-vite`, `@vitejs/plugin-vue2`, and Vite dependencies.
* Create `electron.vite.config.js` mapping main, preload, and renderer targets.
* Update `package.json` scripts (`dev`, `build`, `preview`).
* Verify dev server starts and application bundles correctly.

### Phase 2: Electron Upgrade & IPC Stabilization
* Upgrade `electron` to version 28+.
* Implement `src/preload/index.js` using `contextBridge`.
* Test core functionalities:
  * `aria2` binary daemon auto-launch and WebSocket communication.
  * Task creation (HTTP, Magnet, Torrent).
  * System tray, native menus, and window lifecycle.

### Phase 3: Component & Codebase Refactoring
* Modernize Vue components to Composition API (`<script setup>`).
* Cleanup legacy `.electron-vue` build directory.
* Modularize store modules in preparation for Pinia migration.

---

## 4. Verification & Testing

* **Build & Dev:** Run `npm run dev` to verify instant HMR and renderer launch.
* **Functional Testing:** Test downloading files via aria2 engine, pausing/resuming tasks, changing settings, and window controls.
* **Packaging Verification:** Run `npm run build` to verify `electron-builder` correctly packages binaries.
