import { describe, expect, it } from 'vitest'
import { buildCategoryDir, detectCategoryFromFileName } from '@shared/utils/category'

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
})
