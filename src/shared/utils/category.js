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

function getNameFromResource (resource) {
  let name = resource.split('?')[0].split('#')[0]
  try {
    name = new URL(resource).pathname
  } catch (err) {
    // Not a URL, treat it as a plain file name
  }
  return name.split(/[\\/]/).pop()
}

export function detectCategoryFromFileName (filename = '') {
  if (!filename) return 'other'

  const parts = getNameFromResource(filename).split('.')
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

export function buildCategoryDir (dir, resource) {
  const category = detectCategoryFromFileName(resource)
  if (!dir || category === 'other') return dir

  const separator = dir.includes('\\') && !dir.includes('/') ? '\\' : '/'
  return `${dir.replace(/[\\/]+$/, '')}${separator}${getCategoryFolderName(category)}`
}
