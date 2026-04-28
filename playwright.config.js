import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  timeout: 30_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
      },
    },
  ],
  webServer: {
    command: 'node server.mjs',
    port: 3000,
    timeout: 15_000,
    reuseExistingServer: !process.env.CI,
  },
})
