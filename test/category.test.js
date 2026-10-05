import { describe, expect, it } from 'vitest'
import { buildCategoryDir, detectCategoryFromFileName, getCategoryFolderName } from '@shared/utils/category'

describe('detectCategoryFromFileName', () => {
  it('uses the URL path, not the query string', () => {
    expect(detectCategoryFromFileName('https://x.com/a/movie.MKV?token=1.zip')).toBe('videos')
    expect(detectCategoryFromFileName('https://x.com/download.php?f=a.mp4')).toBe('other')
  })

  it('handles plain file names and magnet links', () => {
    expect(detectCategoryFromFileName('report.pdf')).toBe('documents')
    expect(detectCategoryFromFileName('magnet:?xt=urn:btih:abc&dn=file.mp4')).toBe('other')
    expect(detectCategoryFromFileName('')).toBe('other')
  })
})

describe('buildCategoryDir', () => {
  it('appends the category folder with the separator style of the base dir', () => {
    expect(buildCategoryDir('/home/u/Downloads', 'https://x.com/song.mp3')).toBe('/home/u/Downloads/Audio')
    expect(buildCategoryDir('C:\\Users\\u\\Downloads\\', 'https://x.com/song.mp3')).toBe('C:\\Users\\u\\Downloads\\Audio')
    expect(buildCategoryDir('/d/', 'ftp://h/a.tar.gz')).toBe('/d/Archives')
  })

  it('leaves the dir unchanged for unknown types', () => {
    expect(buildCategoryDir('/d', 'https://x.com/')).toBe('/d')
    expect(buildCategoryDir('/d', 'notes.bin')).toBe('/d')
  })

  it('honors custom category rules over the built-in defaults', () => {
    const extensions = { comics: ['cbz', 'cbr'] }
    const folders = { comics: 'Comics' }
    expect(buildCategoryDir('/d', 'issue1.cbz', { extensions, folders })).toBe('/d/Comics')
    // Extensions the custom set doesn't cover fall through to 'other', not the built-in default.
    expect(buildCategoryDir('/d', 'song.mp3', { extensions, folders })).toBe('/d')
  })
})

describe('getCategoryFolderName', () => {
  it('falls back to the default folder name for an empty or unsafe custom name', () => {
    expect(getCategoryFolderName('videos', { videos: '' })).toBe('Videos')
    expect(getCategoryFolderName('videos', { videos: '   ' })).toBe('Videos')
    expect(getCategoryFolderName('videos', {})).toBe('Videos')
  })

  it('rejects a custom folder name that could escape the download directory', () => {
    expect(getCategoryFolderName('videos', { videos: '../../evil' })).toBe('Videos')
    expect(getCategoryFolderName('videos', { videos: '/etc/passwd' })).toBe('Videos')
    expect(getCategoryFolderName('videos', { videos: 'a\\b' })).toBe('Videos')
  })

  it('accepts a plain custom folder name', () => {
    expect(getCategoryFolderName('videos', { videos: 'Films' })).toBe('Films')
  })
})
