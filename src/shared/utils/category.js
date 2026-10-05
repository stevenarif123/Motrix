export const DEFAULT_CATEGORY_EXTENSIONS = {
  videos: ['mp4', 'mkv', 'avi', 'mov', 'flv', 'webm', 'wmv', 'm4v'],
  audio: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'alac'],
  documents: ['pdf', 'epub', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'mobi'],
  archives: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso', 'dmg'],
  applications: ['exe', 'msi', 'pkg', 'deb', 'rpm', 'apk']
}

export const DEFAULT_CATEGORY_FOLDERS = {
  videos: 'Videos',
  audio: 'Audio',
  documents: 'Documents',
  archives: 'Archives',
  applications: 'Applications',
  other: 'Other'
}

function getNameFromResource (resource) {
  let name = resource.split('?')[0].split('#')[0]
  try {
    name = new URL(resource).pathname
  } catch (err) {
    // Not a URL, treat it as a plain file name
  }
  return name.split(/[\\/]/).pop()
}

// A custom folder name comes from user preferences, so it must not be able
// to escape the download directory or point at an absolute path.
function sanitizeFolderName (name, fallback) {
  if (typeof name !== 'string') {
    return fallback
  }

  const trimmed = name.trim()
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\') || trimmed.includes('..')) {
    return fallback
  }

  return trimmed
}

export function detectCategoryFromFileName (filename = '', extensions = DEFAULT_CATEGORY_EXTENSIONS) {
  if (!filename) return 'other'

  const parts = getNameFromResource(filename).split('.')
  if (parts.length <= 1) return 'other'

  const ext = parts.pop().toLowerCase()

  for (const [category, categoryExtensions] of Object.entries(extensions)) {
    if (Array.isArray(categoryExtensions) && categoryExtensions.includes(ext)) {
      return category
    }
  }

  return 'other'
}

export function getCategoryFolderName (category = 'other', folders = DEFAULT_CATEGORY_FOLDERS) {
  const fallback = DEFAULT_CATEGORY_FOLDERS[category] || DEFAULT_CATEGORY_FOLDERS.other
  return sanitizeFolderName(folders[category], fallback)
}

export function buildCategoryDir (dir, resource, options = {}) {
  const { folders = DEFAULT_CATEGORY_FOLDERS, extensions = DEFAULT_CATEGORY_EXTENSIONS } = options
  const category = detectCategoryFromFileName(resource, extensions)
  if (!dir || category === 'other') return dir

  const separator = dir.includes('\\') && !dir.includes('/') ? '\\' : '/'
  return `${dir.replace(/[\\/]+$/, '')}${separator}${getCategoryFolderName(category, folders)}`
}
