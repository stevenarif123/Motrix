import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from './fixtures.js'

// A mo://new-task link can be opened by any web page. It must never be able to
// pick a save location, route through a proxy, or skip the confirmation dialog.
test('mo://new-task strips dir, silent and allProxy and always shows the dialog', async ({ electronApp, window, homeDir, server }) => {
  const evilDir = join(homeDir, 'evil-startup-folder')
  const url = 'mo://new-task' +
    `?uri=${encodeURIComponent(server.asset('sample.bin'))}` +
    `&dir=${encodeURIComponent(evilDir)}` +
    '&silent=true' +
    '&allProxy=http://1.2.3.4:8080' +
    '&out=..%2F..%2Fpwned.bin' +
    '&referer=http://ref.example'

  await electronApp.evaluate((_electron, url) => {
    global.application.protocolManager.handle(url)
  }, url)

  await window.waitForTimeout(1500)

  const state = await window.evaluate(() => ({
    visible: window.app.$store.state.app.addTaskVisible,
    uri: window.app.$store.state.app.addTaskUrl,
    options: window.app.$store.state.app.addTaskOptions
  }))

  expect(state.visible).toBe(true)
  expect(state.uri).toBe(server.asset('sample.bin'))
  expect(state.options).toEqual({ out: 'pwned.bin', referer: 'http://ref.example' })
  expect(existsSync(evilDir)).toBe(false)
})
