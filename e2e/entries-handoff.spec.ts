import { readFile } from 'node:fs/promises'
import { type Page, expect, test } from '@playwright/test'

const CSV =
  'First Name,Last Name,Category,Age,Town,Province,Country,Entered,Studio\nIsla,Grant,Beginner,8,,,,2026-10-01T12:00:00Z,"MacLeod, School"\nAva,,Beginner,9,Calgary,AB,Canada,2026-10-02T12:00:00Z,Thistle'
const payload = {
  channel: 'scotdance:entries-splits',
  version: 1,
  type: 'import',
  requestId: 'request-1',
  competitionId: 'winter-2026',
  date: '2026-11-21',
  name: 'Winter Highland.csv',
  text: CSV,
}
const STAND_IN = `window.ScotDance = { send(item) { (window.__sent ??= []).push(item); return Promise.resolve({ sent: false }); } }`

async function openFromEntries(page: Page, origin = 'http://localhost:5290') {
  await page.context().route(`${origin}/**`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: '<!doctype html><title>Entries stand-in</title><script>window.messages=[]; addEventListener("message", e => window.messages.push(e.data));</script>',
    }),
  )
  await page.goto(origin)
  const popupPromise = page.waitForEvent('popup')
  await page.evaluate(() => {
    ;(window as unknown as { splits: Window | null }).splits = window.open(
      'http://localhost:5190/?from=entries',
    )
  })
  const popup = await popupPromise
  await popup.waitForLoadState('domcontentloaded')
  return popup
}
async function messages(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as { messages: { type: string; requestId?: string; message?: string }[] })
        .messages,
  )
}
async function send(page: Page, data: unknown = payload) {
  await page.evaluate(
    (data) =>
      (window as unknown as { splits: Window }).splits.postMessage(data, 'http://localhost:5190'),
    data,
  )
}
async function download(popup: Page) {
  const waiting = popup.waitForEvent('download')
  await popup.getByRole('button', { name: 'Download', exact: true }).click()
  return readFile(await (await waiting).path(), 'utf8')
}

// Contract validation protects the current dataset before a replacement is attempted.
test('rejects unsupported, oversized, birthday and invalid age/date payloads', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(
    async ({ payload, CSV }) => {
      const { readEntriesImport, entriesOrigins } = await import('/src/lib/entries.ts')
      const invalid = [
        { version: 2 },
        { date: '2026-02-30' },
        { competitionId: '../other' },
        { text: 'x'.repeat(1_000_001) },
        { text: CSV.replace(',Age,', ',Birthday,') },
        { text: CSV.replace(',8,', ',8years,') },
      ]
      return {
        competitionId: readEntriesImport(payload).competitionId,
        rejected: invalid.map((changes) => {
          try {
            readEntriesImport({ ...payload, ...changes })
            return false
          } catch {
            return true
          }
        }),
        production: entriesOrigins(false, 'http://localhost:9999'),
        development: entriesOrigins(true, 'https://evil.test'),
      }
    },
    { payload, CSV },
  )
  expect(result.competitionId).toBe('winter-2026')
  expect(result.rejected).toEqual([true, true, true, true, true, true])
  expect(result.production).toEqual(['https://entries.scotdance.app'])
  expect(result.development).not.toContain('https://evil.test')
})

test('receives a list after a delayed handshake, preserves studios and preselects its competition', async ({
  page,
}) => {
  await page
    .context()
    .route('http://scotdance.test/embed.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: STAND_IN }),
    )
  const popup = await openFromEntries(page)
  await expect
    .poll(async () => (await messages(page)).filter((m) => m.type === 'ready').length)
    .toBeGreaterThan(1)
  await send(page)
  await expect
    .poll(async () => (await messages(page)).some((m) => m.type === 'imported'))
    .toBe(true)
  await expect(popup).toHaveURL(/\/splits$/)
  await expect(popup.getByRole('status')).toContainText('Winter Highland')
  expect(await popup.evaluate(() => localStorage.getItem('competitionDate'))).toContain(
    '2026-11-21',
  )
  await popup.getByRole('button', { name: /Next/ }).click()
  await popup.getByRole('button', { name: 'Send to ScotDance.app' }).click()
  await expect.poll(() => popup.evaluate(() => window.__sent?.length)).toBe(1)
  const sent = await popup.evaluate(() => window.__sent![0])
  expect(sent).toMatchObject({ competitionId: 'winter-2026' })
  expect(sent.text).toContain('Number,First name,Last name,Location,Studio')
  expect(sent.text).toContain('Isla,Grant,,"MacLeod, School"')
  expect(sent.text).toContain('Ava,,"Calgary, AB",Thistle')
  expect(await download(popup)).toBe(sent.text)
  // A replay acknowledges the original request without replacing the organiser's work.
  await send(page)
  await expect
    .poll(async () => (await messages(page)).filter((m) => m.type === 'imported').length)
    .toBe(2)
  await popup.close({ runBeforeUnload: false })
})

test('keeps studio in combined-name downloads and clears destination on a manual replacement', async ({
  page,
}) => {
  await page
    .context()
    .route('http://scotdance.test/embed.js', (route) =>
      route.fulfill({ contentType: 'text/javascript', body: STAND_IN }),
    )
  const popup = await openFromEntries(page)
  await expect.poll(async () => (await messages(page)).some((m) => m.type === 'ready')).toBe(true)
  await send(page)
  await expect(popup).toHaveURL(/\/splits$/)
  await popup.getByRole('button', { name: /Next/ }).click()
  if (await popup.getByRole('button', { name: /Show settings/i }).isVisible())
    await popup.getByRole('button', { name: /Show settings/i }).click()
  await popup.getByRole('switch', { name: 'Combine names' }).click()
  const csv = await download(popup)
  expect(csv).toContain('Number,Full name,Location,Studio')
  expect(csv).toContain('Isla Grant,,"MacLeod, School"')
  popup.once('dialog', (dialog) => dialog.accept())
  await popup
    .locator('input[type=file]')
    .setInputFiles({ name: 'other.csv', mimeType: 'text/csv', buffer: Buffer.from(CSV) })
  await expect(popup.getByText('From Entries ·')).toHaveCount(0)
  await popup.getByRole('button', { name: /Next/ }).click()
  await popup.getByRole('button', { name: 'Send to ScotDance.app' }).click()
  await expect.poll(() => popup.evaluate(() => window.__sent?.length)).toBe(1)
  expect(await popup.evaluate(() => window.__sent![0])).not.toHaveProperty('competitionId')
  await popup.close({ runBeforeUnload: false })
})

test('rejects a wrong sender window, wrong origin and malformed lists without overwriting data', async ({
  page,
}) => {
  const popup = await openFromEntries(page)
  await expect.poll(async () => (await messages(page)).some((m) => m.type === 'ready')).toBe(true)
  await popup.evaluate(
    (data) =>
      window.dispatchEvent(
        new MessageEvent('message', { origin: 'http://localhost:5290', source: window, data }),
      ),
    payload,
  )
  await popup.evaluate(
    (data) =>
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://entries.scotdance.app.evil.test',
          source: window.opener,
          data,
        }),
      ),
    payload,
  )
  await expect(popup).toHaveURL(/from=entries/)
  expect((await messages(page)).some((m) => m.type === 'imported')).toBe(false)
  await send(page, { ...payload, text: 'not a dancer list' })
  await expect(popup.getByRole('alert')).toContainText('columns are not recognised')
  await send(page, { ...payload, requestId: 'valid-request' })
  await expect(popup).toHaveURL(/\/splits$/)
  await send(page, { ...payload, requestId: 'malformed-again', date: '2026-02-30' })
  await expect(popup.getByRole('alert')).toContainText('date is invalid')
  await expect(popup.getByText('From Entries ·')).toContainText('Winter Highland')
  await popup.close({ runBeforeUnload: false })
})

test('asks before replacing work, keeps it on cancel and accepts a new request later', async ({
  page,
}) => {
  const popup = await openFromEntries(page)
  await expect.poll(async () => (await messages(page)).some((m) => m.type === 'ready')).toBe(true)
  await send(page)
  await expect(popup).toHaveURL(/\/splits$/)
  popup.once('dialog', (dialog) => dialog.dismiss())
  await send(page, {
    ...payload,
    requestId: 'cancel',
    name: 'Other competition.csv',
    competitionId: 'other',
  })
  await expect
    .poll(async () =>
      (await messages(page)).some((m) => m.type === 'error' && m.requestId === 'cancel'),
    )
    .toBe(true)
  await expect(popup.getByText('From Entries ·')).toContainText('Winter Highland')
  popup.once('dialog', (dialog) => dialog.accept())
  await send(page, {
    ...payload,
    requestId: 'replace',
    name: 'Other competition.csv',
    competitionId: 'other',
  })
  await expect(popup.getByText('From Entries ·')).toContainText('Other competition')
  await popup.close({ runBeforeUnload: false })
})

test('explains missing and closed Entries windows without replacing a list', async ({
  page,
  context,
}) => {
  await page.goto('/?from=entries')
  await expect(page.getByRole('alert')).toContainText('Open Splits using')
  const opener = await context.newPage()
  const popup = await openFromEntries(opener)
  await expect.poll(async () => (await messages(opener)).some((m) => m.type === 'ready')).toBe(true)
  await opener.close()
  await expect(popup.getByRole('alert')).toContainText('Entries was closed')
  await expect(popup).toHaveURL(/from=entries/)
  await popup.close()
})
