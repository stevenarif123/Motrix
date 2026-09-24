# Motrix Modernized (Fork)

<p align="center">
  <img src="./static/512x512.png" width="160" alt="Motrix App Icon" />
</p>

<h3 align="center">A Full-Featured Download Manager (Modernized & Extended)</h3>

<p align="center">
  Motrix Modernized is an actively maintained fork of Motrix, built with Electron, Vite, Vue, and aria2.
</p>

---

## ✨ Key Improvements in This Fork

* ⚡ **`electron-vite` Build Engine:** Replaced legacy Webpack builds with `electron-vite` & Vite. Development HMR is near-instant (< 100ms) and production builds take less than 4 seconds.
* 🛡️ **Session Persistence:** `aria2` saves the download session every 10 seconds (`save-session-interval` in `aria2.conf`).
* 🔒 **Locked-Down Engine RPC:** The aria2 RPC listens on localhost only and every install gets a random `rpc-secret`, so other devices and web pages cannot control the engine.
* 📁 **Smart Folder & Categorization:** HTTP/FTP downloads are sorted into `Videos`, `Audio`, `Documents`, `Archives` and `Applications` subfolders based on each file's extension.
* 🧱 **Isolated Renderer:** The UI runs sandboxed with `contextIsolation` and no Node.js access. It talks to the main process only through an allowlisted `contextBridge` preload (`src/preload`), and a Content-Security-Policy restricts what the page can load.
* 🚧 **Planned:** download history with atomic writes (`src/main/core/TaskManager.js`, not wired up yet).

---

## 🚀 Features

- 📑 Simple and clear user interface
- ⚡ Multi-task and multi-thread fast downloading powered by `aria2`
- 🌐 Supports downloading HTTP, HTTPS, FTP, BitTorrent, Magnet, etc.
- 🌙 Automatic system Dark Mode / Light Mode support
- 🔔 Native OS notifications on completion

---

## 🛠️ Development & Building

### Prerequisites

- **Node.js**: `^20.19.0` or `>=22.12.0`
- **npm**: `>=8.0.0`

### Setup

```bash
# Clone your fork repository
git clone <your-fork-url>
cd Motrix

# Install dependencies (use --legacy-peer-deps if npm version requires)
npm install --legacy-peer-deps

# Start development server with instant HMR
npm run dev

# Build production bundle for desktop
npm run build
```

---

## 📄 License

[MIT License](./LICENSE) © Dr_rOot / Motrix Modernized Contributors
