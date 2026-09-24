import { describe, expect, it } from 'vitest'
import { buildUriPayload } from '@/utils/task'
import { DEFAULT_CATEGORY_EXTENSIONS, DEFAULT_CATEGORY_FOLDERS } from '@shared/utils/category'

const baseForm = (overrides = {}) => ({
  dir: '/downloads',
  uris: 'http://x/movie.mp4\nhttp://x/song.mp3',
  autoCategorize: true,
  categoryFolders: DEFAULT_CATEGORY_FOLDERS,
  categoryExtensions: DEFAULT_CATEGORY_EXTENSIONS,
  ...overrides
})

describe('buildUriPayload category routing', () => {
  it('routes each URL into its own category folder when enabled', () => {
    const { dirs } = buildUriPayload(baseForm())
    expect(dirs).toEqual(['/downloads/Videos', '/downloads/Audio'])
  })

  it('leaves every task in the base directory when disabled', () => {
    const { dirs } = buildUriPayload(baseForm({ autoCategorize: false }))
    expect(dirs).toEqual([])
  })

  it('uses a custom folder name from preferences', () => {
    const { dirs } = buildUriPayload(baseForm({
      uris: 'http://x/movie.mp4',
      categoryFolders: { ...DEFAULT_CATEGORY_FOLDERS, videos: 'Films' }
    }))
    expect(dirs).toEqual(['/downloads/Films'])
  })

  it('uses a custom extension list from preferences', () => {
    const { dirs } = buildUriPayload(baseForm({
      uris: 'http://x/issue.cbz',
      categoryExtensions: { ...DEFAULT_CATEGORY_EXTENSIONS, documents: ['cbz'] }
    }))
    expect(dirs).toEqual(['/downloads/Documents'])
  })
})
