import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { type Page, expect, test } from '@playwright/test'

// Send opens ScotDance.app's own sheet through its embed.js (src/lib/scotdance.ts). Here a
// stand-in embed.js records what Splits hands it, and the test says how the sheet closed.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures')
const SCOTDANCE = 'http://scotdance.test' // VITE_SCOTDANCE_URL in .env.e2e

const STAND_IN = `
  window.ScotDance = {
    send(item) {
      (window.__sent ??= []).push(item)
      return new Promise((resolve) => (window.__close = resolve))
    },
  }
`

declare global {
  interface Window {
    __sent?: { source: string; name: string; text: string }[]
    __close?: (_result: unknown) => void
  }
}

async function openExportDialog(page: Page) {
  await page.goto('/')
  await page.locator('input[type="file"]').setInputFiles(path.join(FIXTURES, 'clean-small.csv'))
  await page.waitForURL('**/splits')
  await page.getByRole('button', { name: /Next/ }).click()
  await expect(page.getByText('Export Settings')).toBeVisible()
}

const standIn = (page: Page) =>
  page.route(`${SCOTDANCE}/embed.js`, (route) =>
    route.fulfill({ contentType: 'text/javascript', body: STAND_IN }),
  )

test.describe('Send to ScotDance.app', () => {
  test('hands ScotDance.app the very CSV Download saves, and says where it went', async ({
    page,
  }) => {
    await standIn(page)
    await openExportDialog(page)

    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    await expect.poll(() => page.evaluate(() => window.__sent?.length)).toBe(1)
    const [sent] = await page.evaluate(() => window.__sent!)
    expect(sent).toMatchObject({ source: 'Splits', name: 'clean-small.csv' })

    await page.evaluate(() =>
      window.__close!({
        sent: true,
        competitionId: 'winter',
        competitionName: 'Winter Highland',
        url: 'http://scotdance.test/competitions/winter/import',
      }),
    )
    const note = page.getByRole('status')
    await expect(note).toContainText('Sent to Winter Highland.')
    // and opens that competition's Import dancers, where the list is waiting
    await expect(note.getByRole('link', { name: 'Open it' })).toHaveAttribute(
      'href',
      `${SCOTDANCE}/competitions/winter/import`,
    )

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download' }).click()
    const downloaded = await readFile(await (await downloadPromise).path(), 'utf8')
    expect(sent.text).toBe(downloaded)
  })

  test('closed without sending, it says nothing', async ({ page }) => {
    await standIn(page)
    await openExportDialog(page)
    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    await expect.poll(() => page.evaluate(() => window.__sent?.length)).toBe(1)
    await page.evaluate(() => window.__close!({ sent: false }))
    await expect(page.getByRole('button', { name: 'Send to ScotDance.app' })).toBeEnabled()
    await expect(page.getByText(/^Sent to/)).toHaveCount(0)
  })

  test('says so when ScotDance.app can’t be reached, and tries again', async ({ page }) => {
    let reachable = false
    await page.route(`${SCOTDANCE}/embed.js`, (route) =>
      reachable
        ? route.fulfill({ contentType: 'text/javascript', body: STAND_IN })
        : route.abort('internetdisconnected'),
    )
    await openExportDialog(page)

    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    await expect(page.getByRole('alert')).toHaveText(/Couldn’t reach ScotDance.app/)

    reachable = true
    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    await expect.poll(() => page.evaluate(() => window.__sent?.length)).toBe(1)
  })

  test('Download works as before, without loading ScotDance.app', async ({ page }) => {
    const toScotDance: string[] = []
    page.on('request', (r) => r.url().startsWith(SCOTDANCE) && toScotDance.push(r.url()))
    await openExportDialog(page)

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download' }).click()
    expect((await downloadPromise).suggestedFilename()).toMatch(/\.csv$/)
    expect(toScotDance).toEqual([])
  })
})
