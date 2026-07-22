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
* 🛡️ **Crash-Proof Persistence & History Protection:**
  * Enabled `aria2` session auto-saving every 30 seconds (`--save-session-interval=30`).
  * Implemented `TaskManager` with **atomic writes** (`write-file-atomic`) and **automatic backup recovery** (`download-history.json.bak`). History is never lost or corrupted on abrupt system power loss/crash.
* 🔒 **Modern IPC Security:** Preload script isolation via Electron `contextBridge`.
* 📁 **Smart Folder & Categorization:** *(In Progress)* Automatic sorting of downloads into Videos, Music, Documents, and Archives.

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

- **Node.js**: `>=16.0.0`
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
