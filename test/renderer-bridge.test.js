import { beforeAll, describe, expect, it, vi } from 'vitest'

const handlers = {}
const trashItem = vi.fn(() => Promise.resolve())

vi.mock('electron', () => ({
  app: { getName: () => 'test', getVersion: () => '0.0.0' },
  BrowserWindow: { fromWebContents: () => null },
  clipboard: { readText: () => '' },
  dialog: {},
  ipcMain: { handle: (channel, fn) => { handlers[channel] = fn } },
  shell: { trashItem, showItemInFolder: vi.fn(), openPath: vi.fn() }
}))
vi.mock('../src/main/core/Logger', () => ({ default: { warn: vi.fn() } }))

beforeAll(async () => {
  const { setupRendererBridge } = await import('../src/main/core/RendererBridge')
  setupRendererBridge()
})

describe('shell:trash-task-files', () => {
  const trash = (args) => handlers['shell:trash-task-files']({}, args)

  it('refuses paths outside the task directory', async () => {
    await expect(trash({ dir: '/downloads', path: '/etc/passwd' })).rejects.toThrow()
    await expect(trash({ dir: '/downloads', path: '/downloads' })).rejects.toThrow()
    await expect(trash({ dir: '/downloads', path: '/downloads/../home' })).rejects.toThrow()
    expect(trashItem).not.toHaveBeenCalled()
  })

  it('accepts files inside the task directory', async () => {
    await expect(trash({ dir: '/downloads', path: '/downloads/missing-file.bin' })).resolves.toBe(true)
  })
})
