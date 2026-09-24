import { describe, expect, it, vi } from 'vitest'

vi.mock('axios', () => ({
  default: {
    get: vi.fn((url) => url.startsWith('https://ok')
      ? Promise.resolve({ data: 'udp://a:1/announce\nudp://b:2/announce\n' })
      : Promise.reject(new Error('network down')))
  }
}))

const {
  convertTrackerDataToComma,
  fetchBtTrackerFromSource,
  reduceTrackerString
} = await import('@shared/utils/tracker')

describe('fetchBtTrackerFromSource', () => {
  it('returns an empty list when every source fails', async () => {
    await expect(fetchBtTrackerFromSource(['https://bad/1', 'https://bad/2'])).resolves.toEqual([])
  })

  it('keeps only successful responses', async () => {
    const result = await fetchBtTrackerFromSource(['https://bad/1', 'https://ok/1'])
    expect(result).toEqual(['udp://a:1/announce\nudp://b:2/announce'])
    expect(convertTrackerDataToComma(result)).toBe('udp://a:1/announce,udp://b:2/announce')
  })
})

describe('reduceTrackerString', () => {
  it('cuts at a comma boundary when the list is too long', () => {
    const long = Array.from({ length: 2000 }, (_, i) => `udp://tracker${i}.example:1/announce`).join(',')
    const result = reduceTrackerString(long)
    expect(result.length).toBeLessThan(long.length)
    expect(result.endsWith('announce')).toBe(true)
  })
})
