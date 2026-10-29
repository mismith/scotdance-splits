import { defineConfig } from '@playwright/test'

// Its own port and mode: `--mode e2e` swaps ScotDance.app's Firebase for a fake.
const baseURL = 'http://localhost:5190'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    screenshot: 'off', // we take manual screenshots for the gallery
    contextOptions: {
      reducedMotion: 'reduce',
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'mobile',
      use: { browserName: 'chromium', viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'npx vite --mode e2e --port 5190 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
