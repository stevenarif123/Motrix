import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '/unused' } }))
vi.mock('../src/main/core/Logger', () => ({ default: { warn: vi.fn(), error: vi.fn(), info: vi.fn() } }))

const { default: HistoryManager } = await import('../src/main/core/HistoryManager')

const entry = (overrides = {}) => ({
  id: 'gid-1',
  name: 'movie.mp4',
  uri: 'http://x/movie.mp4',
  dir: '/downloads',
  path: '/downloads/Videos/movie.mp4',
  category: 'videos',
  totalLength: 1000,
  status: 'complete',
  errorCode: null,
  createdAt: 1000,
  finishedAt: 1000,
  ...overrides
})

describe('HistoryManager', () => {
  let baseDir

  beforeEach(() => {
    baseDir = mkdtempSync(join(tmpdir(), 'motrix-history-'))
  })

  afterEach(() => {
    rmSync(baseDir, { recursive: true, force: true })
    vi.useRealTimers()
  })

  it('starts empty when there is no history file', () => {
    const manager = new HistoryManager({ baseDir })
    expect(manager.list()).toEqual({ total: 0, items: [] })
  })

  it('records an entry and makes it available immediately, in memory', () => {
    const manager = new HistoryManager({ baseDir })
    manager.record(entry())

    const { total, items } = manager.list()
    expect(total).toBe(1)
    expect(items[0]).toMatchObject({ id: 'gid-1', name: 'movie.mp4' })
  })

  it('debounces the save and writes both the file and its backup', () => {
    vi.useFakeTimers()
    const manager = new HistoryManager({ baseDir })
    manager.record(entry())

    expect(() => readFileSync(join(baseDir, 'download-history.json'))).toThrow()

    vi.advanceTimersByTime(1000)

    const saved = JSON.parse(readFileSync(join(baseDir, 'download-history.json'), 'utf8'))
    const backup = JSON.parse(readFileSync(join(baseDir, 'download-history.json.bak'), 'utf8'))
    expect(saved).toHaveLength(1)
    expect(backup).toHaveLength(1)
  })

  it('flush() writes immediately without waiting for the debounce timer', () => {
    vi.useFakeTimers()
    const manager = new HistoryManager({ baseDir })
    manager.record(entry())
    manager.flush()

    const saved = JSON.parse(readFileSync(join(baseDir, 'download-history.json'), 'utf8'))
    expect(saved).toHaveLength(1)
  })

  it('loads previously saved entries on the next launch', () => {
    writeFileSync(join(baseDir, 'download-history.json'), JSON.stringify([entry({ id: 'gid-2' })]))

    const manager = new HistoryManager({ baseDir })
    expect(manager.list().total).toBe(1)
    expect(manager.list().items[0].id).toBe('gid-2')
  })

  it('recovers from the backup when the main file is corrupt', () => {
    writeFileSync(join(baseDir, 'download-history.json'), '{not json')
    writeFileSync(join(baseDir, 'download-history.json.bak'), JSON.stringify([entry({ id: 'gid-3' })]))

    const manager = new HistoryManager({ baseDir })
    expect(manager.list().items.map((item) => item.id)).toEqual(['gid-3'])
  })

  it('evicts the oldest entries once the cap is exceeded', () => {
    const manager = new HistoryManager({ baseDir })
    for (let i = 0; i < 5002; i++) {
      manager.record(entry({ id: `gid-${i}`, finishedAt: i }))
    }

    const { total, items } = manager.list({ limit: 5000 })
    expect(total).toBe(5000)
    // The two oldest (finishedAt 0 and 1) should have been dropped.
    expect(items.some((item) => item.id === 'gid-0')).toBe(false)
    expect(items.some((item) => item.id === 'gid-5001')).toBe(true)
  })

  it('removes entries by id', () => {
    const manager = new HistoryManager({ baseDir })
    manager.record(entry({ id: 'gid-1' }))
    manager.record(entry({ id: 'gid-2' }))

    manager.remove(['gid-1'])

    const { total, items } = manager.list()
    expect(total).toBe(1)
    expect(items[0].id).toBe('gid-2')
  })

  it('clears every entry', () => {
    const manager = new HistoryManager({ baseDir })
    manager.record(entry())
    manager.clear()

    expect(manager.list().total).toBe(0)
  })

  describe('list()', () => {
    let manager

    beforeEach(() => {
      manager = new HistoryManager({ baseDir })
      manager.record(entry({ id: 'a', name: 'Report.pdf', category: 'documents', status: 'complete', finishedAt: 3 }))
      manager.record(entry({ id: 'b', name: 'movie.mp4', category: 'videos', status: 'error', finishedAt: 2 }))
      manager.record(entry({ id: 'c', name: 'song.mp3', category: 'audio', status: 'complete', finishedAt: 1 }))
    })

    it('sorts by most recently finished first', () => {
      expect(manager.list().items.map((item) => item.id)).toEqual(['a', 'b', 'c'])
    })

    it('filters by category', () => {
      expect(manager.list({ category: 'videos' }).items.map((item) => item.id)).toEqual(['b'])
    })

    it('filters by status', () => {
      expect(manager.list({ status: 'error' }).items.map((item) => item.id)).toEqual(['b'])
    })

    it('filters by a case-insensitive name search', () => {
      expect(manager.list({ query: 'REPORT' }).items.map((item) => item.id)).toEqual(['a'])
    })

    it('paginates with offset and limit', () => {
      const page = manager.list({ limit: 1, offset: 1 })
      expect(page.total).toBe(3)
      expect(page.items.map((item) => item.id)).toEqual(['b'])
    })
  })
})
