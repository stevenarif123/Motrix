const CATEGORY_MAP = {
  videos: ['mp4', 'mkv', 'avi', 'mov', 'flv', 'webm', 'wmv', 'm4v'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'alac'],
  documents: ['pdf', 'epub', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'mobi'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'dmg'],
  applications: ['exe', 'msi', 'pkg', 'deb', 'rpm', 'apk']
}

const CATEGORY_FOLDERS = {
  videos: 'Videos',
  audio: 'Audio',
  documents: 'Documents',
  archives: 'Archives',
  applications: 'Applications',
  other: 'Other'
}

export function detectCategoryFromFileName (filename = '') {
  if (!filename) return 'other'

  // Extract extension
  const cleanName = filename.split('?')[0].split('#')[0]
  const parts = cleanName.split('.')
  if (parts.length <= 1) return 'other'

  const ext = parts.pop().toLowerCase()

  for (const [category, extensions] of Object.entries(CATEGORY_MAP)) {
    if (extensions.includes(ext)) {
      return category
    }
  }

  return 'other'
}

export function getCategoryFolderName (category = 'other') {
  return CATEGORY_FOLDERS[category] || CATEGORY_FOLDERS.other
}
