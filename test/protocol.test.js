import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: {} }))
vi.mock('electron-is', () => ({ default: { dev: () => true, mas: () => false } }))
vi.mock('../src/main/core/Logger', () => ({ default: { info: vi.fn(), warn: vi.fn() } }))

const { default: ProtocolManager } = await import('../src/main/core/ProtocolManager')

describe('ProtocolManager.sanitizeArgs', () => {
  const manager = new ProtocolManager()

  it('drops options a web page must not control on new-task', () => {
    const result = manager.sanitizeArgs('new-task', {
      uri: 'http://x/a.mp3',
      dir: 'C:\\Users\\u\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Startup',
      silent: 'true',
      allProxy: 'http://1.2.3.4:8080',
      out: '..\\..\\evil.bat',
      referer: 'http://ref'
    })
    expect(result).toEqual({ uri: 'http://x/a.mp3', out: 'evil.bat', referer: 'http://ref' })
  })

  it('passes other commands through', () => {
    expect(manager.sanitizeArgs('task-list', { status: 'stopped' })).toEqual({ status: 'stopped' })
  })
})
