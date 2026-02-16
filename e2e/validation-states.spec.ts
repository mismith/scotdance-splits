import { test, expect, type Page, type TestInfo } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures')
const SCREENSHOTS = path.join(__dirname, 'screenshots')

async function uploadFixture(page: Page, filename: string) {
  await page.locator('input[type="file"]').setInputFiles(path.join(FIXTURES, filename))
}

async function waitForSplitsPage(page: Page) {
  await page.waitForURL('**/splits')
  // Wait for view transition to complete (router clears viewTransitionName on finish)
  await page.waitForFunction(
    () => !document.documentElement.style.viewTransitionName,
  )
}

async function waitForAnimations(page: Page) {
  await page.waitForFunction(() =>
    document.getAnimations().every((a) => {
      const timing = a.effect?.getComputedTiming()
      // Ignore infinite animations (spinners, pulsing effects, etc.)
      return !timing || timing.iterations === Infinity || a.playState === 'finished'
    }),
  )
}

function screenshotPath(testInfo: TestInfo, name: string) {
  // e.g. e2e/screenshots/desktop/01-happy-path.png
  return path.join(SCREENSHOTS, testInfo.project.name, name)
}

test.describe('Validation States', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('01 - happy path (clean data)', async ({ page }, testInfo) => {
    await uploadFixture(page, 'clean-small.csv')
    await waitForSplitsPage(page)
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible()
    await expect(page.getByText('data issue')).not.toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '01-happy-path.png') })
  })

  test('02 - non-CSV file rejected', async ({ page }, testInfo) => {
    await uploadFixture(page, 'not-a-csv.txt')
    // Stays on home page — file rejected
    await expect(page.getByText('Only CSV files are supported')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '02-non-csv-file.png') })
  })

  test('03 - empty file', async ({ page }, testInfo) => {
    await uploadFixture(page, 'empty.csv')
    // Stays on home page — parse error
    await expect(page.getByText('CSV file is empty')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '03-empty-file.png') })
  })

  test('04 - missing code column (no synthesis columns)', async ({ page }, testInfo) => {
    await uploadFixture(page, 'missing-code-column.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('Missing Highland Scrutineer code')).toBeVisible()
    await expect(page.getByText('Category + Age or Birthday')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '04-missing-code-column.png') })
  })

  test('05 - missing data (empty codes)', async ({ page }, testInfo) => {
    await uploadFixture(page, 'missing-data.csv')
    await waitForSplitsPage(page)
    // Warning: rows with no code were skipped (no invalid format codes in this fixture)
    await expect(page.getByText('with no code')).toBeVisible()
    await expect(page.getByText('invalid codes')).not.toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '05-missing-data.png') })
  })

  test('06 - mixed valid and invalid codes', async ({ page }, testInfo) => {
    await uploadFixture(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)
    // Both warnings: invalid format codes + empty code cells
    await expect(page.getByText('invalid codes')).toBeVisible()
    await expect(page.getByText('with no code')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '06-mixed-valid-invalid.png') })
  })

  test('07 - no valid codes (invalid format)', async ({ page }, testInfo) => {
    await uploadFixture(page, 'invalid-code-format.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('No valid dancer codes found')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '07-no-valid-codes.png') })
  })
})

test.describe('Synthesis Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('08 - synthesis from category + age (happy path)', async ({ page }, testInfo) => {
    await uploadFixture(page, 'category-age.csv')
    await waitForSplitsPage(page)
    // Should auto-detect category and age columns and synthesize codes
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible()
    await expect(page.getByText('data issue')).not.toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '08-synthesis-category-age.png') })
  })

  test('09 - synthesis from birthday requires competition date', async ({ page }, testInfo) => {
    await uploadFixture(page, 'category-birthday.csv')
    await waitForSplitsPage(page)
    // Should show competition date required error
    await expect(page.getByText('Competition date is required')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '09-synthesis-missing-date.png') })
  })

  test('10 - synthesis from birthday with competition date set', async ({ page }, testInfo) => {
    await uploadFixture(page, 'category-birthday.csv')
    await waitForSplitsPage(page)

    // Open Fields dialog via Review button
    await page.getByRole('button', { name: 'Review' }).click()
    await expect(page.getByRole('heading', { name: 'Fields' })).toBeVisible()

    // Competition date input should be visible (accordion auto-expanded)
    await expect(page.getByLabel('Competition date')).toBeVisible()

    // Set competition date
    await page.getByLabel('Competition date').fill('2023-07-15')

    // Close dialog
    await page.getByRole('button', { name: 'Done' }).click()

    // Should now have valid synthesized codes — no errors
    await expect(page.getByText('Competition date is required')).not.toBeVisible()
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '10-synthesis-with-date.png') })
  })

  test('11 - unrecognized categories warning', async ({ page }, testInfo) => {
    await uploadFixture(page, 'unrecognized-categories.csv')
    await waitForSplitsPage(page)
    // Should show warning about unrecognized categories
    await expect(page.getByText('unrecognized category')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '11-unrecognized-categories.png') })
  })

  test('12 - direct code column takes priority over synthesis', async ({ page }, testInfo) => {
    await uploadFixture(page, 'clean-small.csv')
    await waitForSplitsPage(page)
    // Direct code column should work as normal — no synthesis active
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible()
    await expect(page.getByText('data issue')).not.toBeVisible()

    // Open Fields dialog — synthesis section should be hidden when code is mapped
    await page.getByRole('button', { name: /Fields/ }).click()
    await expect(page.getByText('Highland Scrutineer code')).toBeVisible()
    await expect(page.getByText('or generate from')).not.toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '12-direct-code-priority.png') })
  })
})

test.describe('Validation Interactions', () => {
  test('dismiss warning banner → secondary indicator appears', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)

    await expect(page.getByText('invalid codes')).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss' }).click()

    // Secondary indicator should appear with issue count
    await expect(page.getByText('issue')).toBeVisible()
    // Wait for view transition animations to register, then finish
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, '08-warning-after-dismiss.png') })
  })

  test('dismiss error banner → secondary error indicator with Review', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'invalid-code-format.csv')
    await waitForSplitsPage(page)

    await expect(page.getByText('No valid dancer codes found')).toBeVisible()
    await page.getByRole('button', { name: 'Dismiss' }).click()

    // Secondary indicator should appear with error styling
    await expect(page.getByText('issue')).toBeVisible()
    await expect(page.getByRole('button', { name: /issue/ })).toBeVisible()
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, '09-error-after-dismiss.png') })
  })

  test('click Review → column mapping dialog opens', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)

    await expect(page.getByText('invalid codes')).toBeVisible()

    // Click Review button on the validation banner
    await page.getByRole('button', { name: 'Review' }).click()

    // Fields dialog should open
    await expect(page.getByRole('heading', { name: 'Fields' })).toBeVisible()
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, '10-fields-dialog.png') })
  })

  test('export dialog opens with settings', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'clean-small.csv')
    await waitForSplitsPage(page)

    // Clean data — Next button visible
    await expect(page.getByRole('button', { name: /Next/ })).toBeVisible()

    // Open export dialog
    await page.getByRole('button', { name: /Next/ }).click()

    // Export settings dialog should open with title and controls
    await expect(page.getByText('Export Settings')).toBeVisible()
    await expect(page.getByLabel('Highest bib number')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
    await waitForAnimations(page)
    await page.screenshot({ path: screenshotPath(testInfo, '11-export-dialog.png') })
  })
})
