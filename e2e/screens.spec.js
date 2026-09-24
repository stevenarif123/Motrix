import { test, expect } from './fixtures.js'

// Baseline screenshots for each theme. Phase E (Vue 3 / Element Plus) compares
// against these to catch visual regressions the automated checks would miss.
const setTheme = (window, theme) =>
  window.evaluate((theme) => window.app.$store.dispatch('preference/updateAppTheme', theme), theme)

const pages = [
  { name: 'tasks', go: async (window) => window.evaluate(() => { window.app.$router.push('/task/active').catch(() => {}); return 1 }) },
  {
    name: 'add-task',
    go: async (window) => {
      await window.evaluate(() => window.app.$store.dispatch('app/showAddTaskDialog', 'uri'))
      await window.waitForSelector('.add-task-dialog textarea', { state: 'visible' })
    }
  },
  {
    name: 'preferences-basic',
    go: async (window) => window.evaluate(() => { window.app.$router.push('/preference/basic').catch(() => {}); return 1 })
  },
  {
    name: 'preferences-advanced',
    go: async (window) => window.evaluate(() => { window.app.$router.push('/preference/advanced').catch(() => {}); return 1 })
  },
  {
    name: 'about',
    go: async (window) => window.evaluate(() => window.app.$store.dispatch('app/showAboutPanel'))
  }
]

for (const theme of ['light', 'dark']) {
  test.describe(`${theme} theme`, () => {
    for (const page of pages) {
      test(`${page.name}`, async ({ window }) => {
        await setTheme(window, theme)
        await page.go(window)
        await window.waitForTimeout(500)
        await expect(window).toHaveScreenshot(`${page.name}-${theme}.png`, { maxDiffPixelRatio: 0.02 })
      })
    }
  })
}
