# Motrix Auto-Categorization & Smart Folder Design

**Date:** 2026-07-22  
**Status:** Approved  
**Author:** Antigravity AI & Developer  

---

## 1. Overview

Automatic file categorization organizes downloads by file extension into dedicated subfolders (`Videos`, `Audio`, `Documents`, `Archives`, `Applications`, `Other`). This saves users time and prevents cluttered downloads folders.

---

## 2. Category Rule Definitions

| Category | File Extensions | Subfolder Name |
| :--- | :--- | :--- |
| **Videos** | `.mp4`, `.mkv`, `.avi`, `.mov`, `.flv`, `.webm`, `.wmv`, `.m4v` | `Videos` |
| **Audio** | `.mp3`, `.wav`, `.flac`, `.aac`, `.ogg`, `.m4a`, `.wma`, `.alac` | `Audio` |
| **Documents** | `.pdf`, `.epub`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx`, `.txt`, `.mobi` | `Documents` |
| **Archives** | `.zip`, `.rar`, `.7z`, `.tar`, `.gz`, `.bz2`, `.iso`, `.dmg` | `Archives` |
| **Applications** | `.exe`, `.msi`, `.pkg`, `.deb`, `.rpm`, `.apk` | `Applications` |
| **Other** | All remaining file extensions | `Other` |

---

## 3. Component Architecture

1. **`src/shared/utils/category.js`**: Contains category matching logic based on filenames/URLs.
2. **`src/renderer/utils/task.js`**: Integrates category resolution when constructing aria2 RPC download options.
3. **`src/main/core/TaskManager.js`**: Stores category metadata per task for UI status/category filtering.

---

## 4. Verification

- Test category resolution for various URLs (`.mp4`, `.pdf`, `.zip`, `.exe`).
- Verify task options automatically assign subfolder paths when auto-categorization is active.
