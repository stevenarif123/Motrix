import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({ app: { getPath: () => '' } }))
vi.mock('../src/main/core/Logger', () => ({ default: { info: vi.fn(), warn: vi.fn() } }))

const { migrateLegacyUserData } = await import('../src/main/core/Migration')

describe('migrateLegacyUserData', () => {
  let root, fromDir, toDir

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'motrix-migration-'))
    fromDir = join(root, 'legacy')
    toDir = join(root, 'current')
    mkdirSync(fromDir, { recursive: true })
    mkdirSync(toDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(root, { recursive: true, force: true })
  })

  it('does nothing when there is no legacy install', () => {
    expect(migrateLegacyUserData({ fromDir, toDir })).toBe(false)
    expect(existsSync(join(toDir, 'user.json'))).toBe(false)
  })

  it('copies user.json, system.json and dht files, rewriting dht paths', () => {
    writeFileSync(join(fromDir, 'user.json'), JSON.stringify({ theme: 'dark' }))
    writeFileSync(join(fromDir, 'system.json'), JSON.stringify({
      'rpc-secret': 'legacy-secret',
      'dht-file-path': join(fromDir, 'dht.dat'),
      'dht-file-path6': join(fromDir, 'dht6.dat')
    }))
    writeFileSync(join(fromDir, 'dht.dat'), 'dht-v4')
    writeFileSync(join(fromDir, 'dht6.dat'), 'dht-v6')

    expect(migrateLegacyUserData({ fromDir, toDir })).toBe(true)

    expect(JSON.parse(readFileSync(join(toDir, 'user.json'), 'utf8'))).toEqual({ theme: 'dark' })
    expect(readFileSync(join(toDir, 'dht.dat'), 'utf8')).toBe('dht-v4')
    expect(readFileSync(join(toDir, 'dht6.dat'), 'utf8')).toBe('dht-v6')

    const system = JSON.parse(readFileSync(join(toDir, 'system.json'), 'utf8'))
    expect(system['rpc-secret']).toBe('legacy-secret')
    expect(system['dht-file-path']).toBe(join(toDir, 'dht.dat'))
    expect(system['dht-file-path6']).toBe(join(toDir, 'dht6.dat'))
  })

  it('never overwrites settings that already exist', () => {
    writeFileSync(join(fromDir, 'user.json'), JSON.stringify({ theme: 'dark' }))
    writeFileSync(join(toDir, 'user.json'), JSON.stringify({ theme: 'light' }))

    expect(migrateLegacyUserData({ fromDir, toDir })).toBe(false)
    expect(JSON.parse(readFileSync(join(toDir, 'user.json'), 'utf8'))).toEqual({ theme: 'light' })
  })

  it('does not copy the download session', () => {
    writeFileSync(join(fromDir, 'user.json'), '{}')
    writeFileSync(join(fromDir, 'download.session'), 'gid\thttp://x/a.mp4\n')

    migrateLegacyUserData({ fromDir, toDir })

    expect(existsSync(join(toDir, 'download.session'))).toBe(false)
  })
})

describe('runMigration in portable mode', () => {
  it('skips migration entirely, even when a legacy install exists', async () => {
    vi.resetModules()
    vi.doMock('@shared/constants', () => ({ IS_PORTABLE: true }))

    const { runMigration: runPortableMigration } = await import('../src/main/core/Migration')
    // With portable mode short-circuiting first, getLegacyUserDataPath()/app.getPath()
    // are never reached, so passing any toDir here must not throw or touch the filesystem.
    expect(() => runPortableMigration('/any/portable/dir')).not.toThrow()

    vi.doUnmock('@shared/constants')
    vi.resetModules()
  })
})
