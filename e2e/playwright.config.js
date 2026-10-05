import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60 * 1000,
  reporter: [['list']],
  outputDir: '../out/e2e-results'
})
