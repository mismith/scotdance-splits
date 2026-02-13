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
    await expect(page.getByText('Ready to export')).toBeVisible()
    await expect(page.getByText('data issue')).not.toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '01-happy-path.png') })
  })

  test('02 - empty file', async ({ page }, testInfo) => {
    await uploadFixture(page, 'empty.csv')
    // Stays on home page — parse error
    await expect(page.getByText('CSV file is empty')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '02-empty-file.png') })
  })

  test('03 - malformed CSV', async ({ page }, testInfo) => {
    await uploadFixture(page, 'malformed-csv.csv')
    await waitForSplitsPage(page)
    // Should show warning for skipped rows (some valid codes exist)
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '03-malformed-csv.png') })
  })

  test('04 - invalid headers (unrecognized column names)', async ({ page }, testInfo) => {
    await uploadFixture(page, 'invalid-headers.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('Missing')).toBeVisible()
    await expect(page.getByText('column mapping')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '04-invalid-headers.png') })
  })

  test('05 - missing code column', async ({ page }, testInfo) => {
    await uploadFixture(page, 'missing-code-column.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('Missing')).toBeVisible()
    await expect(page.getByText('column mapping')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '05-missing-code-column.png') })
  })

  test('06 - missing data (empty cells)', async ({ page }, testInfo) => {
    await uploadFixture(page, 'missing-data.csv')
    await waitForSplitsPage(page)
    // Should show warning for rows with missing codes
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '06-missing-data.png') })
  })

  test('07 - mixed valid and invalid codes', async ({ page }, testInfo) => {
    await uploadFixture(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)
    // Warning banner with skipped rows and example invalid codes
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '07-mixed-valid-invalid.png') })
  })

  test('08 - no header row', async ({ page }, testInfo) => {
    await uploadFixture(page, 'no-header-row.csv')
    await waitForSplitsPage(page)
    // Without recognizable headers, column auto-detection fails → missing column mapping
    await expect(page.getByText('Missing')).toBeVisible()
    await expect(page.getByText('column mapping')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '08-no-header-row.png') })
  })

  test('09 - no valid codes', async ({ page }, testInfo) => {
    await uploadFixture(page, 'no-valid-codes.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('No valid dancer codes found')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '09-no-valid-codes.png') })
  })

  test('10 - invalid code format', async ({ page }, testInfo) => {
    await uploadFixture(page, 'invalid-code-format.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('No valid dancer codes found')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '10-invalid-code-format.png') })
  })
})

test.describe('Validation Interactions', () => {
  test('dismiss warning banner → secondary indicator appears', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)

    // Warning banner visible
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '11-warning-before-dismiss.png') })

    // Dismiss the banner
    await page.getByRole('button', { name: 'Dismiss' }).click()

    // Secondary indicator should appear with issue count
    await expect(page.getByText('issue')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '12-warning-after-dismiss.png') })
  })

  test('dismiss error banner → secondary error indicator with Review', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'no-valid-codes.csv')
    await waitForSplitsPage(page)

    // Error banner visible
    await expect(page.getByText('No valid dancer codes found')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '13-error-before-dismiss.png') })

    // Dismiss the banner
    await page.getByRole('button', { name: 'Dismiss' }).click()

    // Secondary indicator should appear with error styling and Review button
    await expect(page.getByText('issue')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Review' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '14-error-after-dismiss.png') })
  })

  test('click Review → column mapping dialog opens', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)

    await expect(page.getByText('skipped')).toBeVisible()

    // Click Review button on the validation banner
    await page.getByRole('button', { name: 'Review' }).click()

    // Column mapping dialog should open
    await expect(page.getByText('Column Mapping')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '15-column-mapping-dialog.png') })
  })

  test('export dialog opens with settings', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFixture(page, 'clean-small.csv')
    await waitForSplitsPage(page)

    // Clean data — export CTA visible
    await expect(page.getByText('Ready to export')).toBeVisible()

    // Open export dialog
    await page.getByRole('button', { name: 'Export →' }).click()

    // Export settings dialog should open with title and controls
    await expect(page.getByText('Export Settings')).toBeVisible()
    await expect(page.getByLabel('Highest bib number')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '16-export-dialog.png') })
  })
})
