import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { type Page, type TestInfo, expect, test } from '@playwright/test'

// ScotDance.app is the in-memory fake (src/lib/scotdance-firebase.fake.ts): the e2e
// server runs with `--mode e2e`, so nothing here reaches Firebase or scotdance.app.

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures')
const SCREENSHOTS = path.join(__dirname, 'screenshots')
const SCOTDANCE = 'http://scotdance.test' // VITE_SCOTDANCE_URL in .env.e2e

const UID = 'organiser-1'
const EMAIL = 'organiser@example.com'
const PASSWORD = 'reel-and-strathspey'

function daysFromToday(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

interface FakeState {
  accounts: { uid: string; email: string; password: string }[]
  db: Record<string, unknown>
  signedInUid?: string | null
  failSend?: boolean
  sent?: { uid: string; key: string; value: Record<string, unknown> }[]
}

declare global {
  interface Window {
    __scotdanceFake?: FakeState
  }
}

function fakeState(overrides: Partial<FakeState> = {}): FakeState {
  return {
    accounts: [{ uid: UID, email: EMAIL, password: PASSWORD }],
    db: {
      'users:permissions': {
        [UID]: { competitions: { spring: true, cowal: true, winter: true, revoked: false } },
      },
      competitions: {
        spring: { name: 'Spring Games', date: '2020-05-02' },
        cowal: { name: 'Cowal Gathering', date: daysFromToday(10) },
        winter: { name: 'Winter Highland', date: daysFromToday(60) },
        revoked: { name: 'Not Yours Any More', date: daysFromToday(5) },
        someoneElses: { name: 'Someone Else’s', date: daysFromToday(1) },
      },
    },
    ...overrides,
  }
}

async function openExportDialog(page: Page, state: FakeState) {
  await page.addInitScript((s) => {
    window.__scotdanceFake = s
  }, state)
  // The opened Import dancers tab lands here, never on the real site
  await page
    .context()
    .route(`${SCOTDANCE}/**`, (route) =>
      route.fulfill({ contentType: 'text/html', body: '<title>ScotDance.app</title>' }),
    )
  await page.goto('/')
  await page.locator('input[type="file"]').setInputFiles(path.join(FIXTURES, 'clean-small.csv'))
  await page.waitForURL('**/splits')
  await page.getByRole('button', { name: /Next/ }).click()
  await expect(page.getByText('Export Settings')).toBeVisible()
}

async function waitForAnimations(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => {
      const timing = a.effect?.getComputedTiming()
      return !timing || timing.iterations === Infinity || a.playState === 'finished'
    }),
  )
}

function screenshotPath(testInfo: TestInfo, name: string) {
  return path.join(SCREENSHOTS, testInfo.project.name, name)
}

async function sentItems(page: Page) {
  return page.evaluate(() => window.__scotdanceFake?.sent ?? [])
}

// Its title says what it asks: "Sign in to ScotDance.app", then "Send to ScotDance.app"
const SEND_DIALOG = /^(Sign in|Send) to ScotDance\.app$/

test.describe('Send to ScotDance.app', () => {
  test('signs in, picks a competition, sends and opens Import dancers', async ({
    page,
  }, testInfo) => {
    await openExportDialog(page, fakeState())
    await expect(page.getByText('Your list stays on your device until you send it.')).toBeVisible()

    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    const dialog = page.getByRole('dialog', { name: SEND_DIALOG })
    await expect(dialog.getByRole('heading', { name: 'Sign in to ScotDance.app' })).toBeVisible()
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, 'send-01-sign-in.png') })

    // Standard autocomplete, so saved scotdance.app passwords are offered
    const emailField = dialog.getByLabel('Email address')
    const passwordField = dialog.getByLabel('Password', { exact: true })
    await expect(emailField).toHaveAttribute('autocomplete', 'username')
    await expect(passwordField).toHaveAttribute('autocomplete', 'current-password')

    await emailField.fill(EMAIL)
    await passwordField.fill('wrong')
    await dialog.getByRole('button', { name: 'Sign in' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(/don’t match/)

    await passwordField.fill(PASSWORD)
    await passwordField.press('Enter')
    await expect(dialog.getByText('Which competition are these dancers for?')).toBeVisible()
    await expect(dialog.getByText(`Signed in as ${EMAIL}.`)).toBeVisible()

    // Only the organiser's own competitions, upcoming first (soonest picked), then past ones
    const picker = dialog.getByRole('combobox', { name: 'Competition' })
    await expect(picker).toContainText('Cowal Gathering')
    await picker.click()
    await expect(page.getByRole('option')).toHaveText([
      /^Cowal Gathering/,
      /^Winter Highland/,
      /^Spring Games/,
    ])
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, 'send-02-pick.png') })
    await page.getByRole('option', { name: /Winter Highland/ }).click()

    const popupPromise = page.context().waitForEvent('page')
    await dialog.getByRole('button', { name: 'Send', exact: true }).click()
    const popup = await popupPromise
    await expect(popup).toHaveURL(
      `${SCOTDANCE}/competitions/winter/manage/dancers/import?inbox=-Fake1`,
    )

    const sentDialog = page.getByRole('dialog', { name: 'Sent' })
    await expect(
      sentDialog.getByText('Import dancers for Winter Highland is open in a new tab.'),
    ).toBeVisible()
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, 'send-03-sent.png') })
    await expect(sentDialog.getByRole('link', { name: 'Open Import dancers' })).toHaveAttribute(
      'href',
      `${SCOTDANCE}/competitions/winter/manage/dancers/import?inbox=-Fake1`,
    )

    // Exactly the agreed fields, into the organiser's own inbox
    const sent = await sentItems(page)
    expect(sent).toHaveLength(1)
    expect(sent[0].uid).toBe(UID)
    expect(Object.keys(sent[0].value).sort()).toEqual([
      'competitionId',
      'kind',
      'name',
      'sentAt',
      'source',
      'text',
    ])
    expect(sent[0].value).toMatchObject({
      kind: 'dancers',
      source: 'Splits',
      name: 'clean-small.csv',
      competitionId: 'winter',
      sentAt: { '.sv': 'timestamp' },
    })

    // The text is the very CSV that Download saves
    await sentDialog.getByRole('button', { name: 'Done' }).click()
    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download' }).click()
    const downloaded = await readFile(await (await downloadPromise).path(), 'utf8')
    expect(sent[0].value.text).toBe(downloaded)
  })

  test('resets a password and creates an account, as ScotDance.app does', async ({ page }) => {
    await openExportDialog(page, fakeState())
    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: 'Forgot your password?' }).click()
    await expect(dialog.getByRole('heading', { name: 'Reset your password' })).toBeVisible()
    await expect(dialog.getByLabel('Password', { exact: true })).toHaveCount(0)
    await dialog.getByLabel('Email address').fill(EMAIL)
    await dialog.getByRole('button', { name: 'Send reset link' }).click()
    await expect(dialog.getByRole('status')).toHaveText(`A reset link is on its way to ${EMAIL}.`)
    expect(await page.evaluate(() => window.__scotdanceFake?.resetsSent)).toEqual([EMAIL])

    await dialog.getByRole('button', { name: 'Back to sign in' }).click()
    await dialog.getByRole('button', { name: 'New here? Create an account' }).click()
    await expect(dialog.getByRole('heading', { name: 'Create an account' })).toBeVisible()
    const passwordField = dialog.getByLabel('Choose a password')
    await expect(passwordField).toHaveAttribute('autocomplete', 'new-password')

    await dialog.getByLabel('Email address').fill('new@example.com')
    await passwordField.fill('short')
    await dialog.getByRole('button', { name: 'Create account' }).click()
    await expect(dialog.getByRole('alert')).toHaveText(/at least 6 characters/)

    // A new account manages no competitions yet
    await passwordField.fill('long enough')
    await dialog.getByRole('button', { name: 'Create account' }).click()
    await expect(dialog.getByText('Add your competition on ScotDance.app first')).toBeVisible()
    await expect(dialog.getByText('Signed in as new@example.com.')).toBeVisible()
  })

  test('skips sign-in when already signed in, and can sign out', async ({ page }) => {
    await openExportDialog(page, fakeState({ signedInUid: UID }))
    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    const dialog = page.getByRole('dialog', { name: SEND_DIALOG })
    await expect(dialog.getByRole('combobox', { name: 'Competition' })).toContainText(
      'Cowal Gathering',
    )

    await dialog.getByRole('button', { name: 'Sign out' }).click()
    await expect(dialog.getByLabel('Email address')).toBeVisible()
  })

  test('with no competitions, says to add one on ScotDance.app first', async ({
    page,
  }, testInfo) => {
    const state = fakeState({ signedInUid: UID })
    state.db['users:permissions'] = {}
    await openExportDialog(page, state)
    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()

    const dialog = page.getByRole('dialog', { name: SEND_DIALOG })
    await expect(dialog.getByText('Add your competition on ScotDance.app first')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Add a competition' })).toHaveAttribute(
      'href',
      `${SCOTDANCE}/competitions/add`,
    )
    await expect(dialog.getByRole('button', { name: 'Send', exact: true })).toHaveCount(0)
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, 'send-04-no-competitions.png') })
  })

  test('offers a link when the browser blocks the new tab', async ({ page }) => {
    await page.addInitScript(() => {
      window.open = () => null
    })
    await openExportDialog(page, fakeState({ signedInUid: UID }))
    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    await page.getByRole('button', { name: 'Send', exact: true }).click()

    const sentDialog = page.getByRole('dialog', { name: 'Sent' })
    await expect(
      sentDialog.getByText('Your list is waiting in Import dancers for Cowal Gathering.'),
    ).toBeVisible()
    await expect(sentDialog.getByRole('link', { name: 'Open Import dancers' })).toHaveAttribute(
      'href',
      `${SCOTDANCE}/competitions/cowal/manage/dancers/import?inbox=-Fake1`,
    )
  })

  test('says so when sending fails, and opens nothing', async ({ page }) => {
    await openExportDialog(page, fakeState({ signedInUid: UID, failSend: true }))
    await page.getByRole('button', { name: 'Send to ScotDance.app' }).click()
    const dialog = page.getByRole('dialog', { name: SEND_DIALOG })
    let opened = false
    page.context().on('page', () => (opened = true))
    await dialog.getByRole('button', { name: 'Send', exact: true }).click()

    await expect(dialog.getByRole('alert')).toHaveText(/Couldn’t send your list/)
    expect(opened).toBe(false)
    expect(await sentItems(page)).toHaveLength(0)
  })

  test('Download works as before, without loading ScotDance.app', async ({ page }) => {
    const scotdanceRequests: string[] = []
    page.on('request', (request) => {
      if (/scotdance-firebase|firebase/.test(request.url())) scotdanceRequests.push(request.url())
    })
    await openExportDialog(page, fakeState())

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe('clean-small - Splits.csv')
    const csv = await readFile(await download.path(), 'utf8')
    expect(csv).toContain('Charlie')
    await expect(page.getByText('Export Settings')).not.toBeVisible()

    expect(scotdanceRequests).toEqual([])
    expect(await sentItems(page)).toHaveLength(0)
  })
})
