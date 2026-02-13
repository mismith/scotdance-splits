import { test, expect, type Page, type TestInfo } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, '..', 'public')
const SCREENSHOTS = path.join(__dirname, 'screenshots')

async function uploadFile(page: Page, filename: string) {
  const filePath = path.join(FIXTURES, filename)
  await page.locator('input[type="file"]').setInputFiles(filePath)
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
    await uploadFile(page, 'clean-small.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('Ready to export')).toBeVisible()
    await expect(page.getByText('data issue')).not.toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '01-happy-path.png') })
  })

  test('02 - realistic data with one incomplete registration', async ({ page }, testInfo) => {
    await uploadFile(page, 'mock-data.csv')
    await waitForSplitsPage(page)
    // mock-data.csv has 1 pending registration with code "NotCompleted"
    await expect(page.getByText('skipped')).toBeVisible({ timeout: 15000 })
    await page.screenshot({
      path: screenshotPath(testInfo, '02-realistic-with-warning.png'),
    })
  })

  test('03 - empty file', async ({ page }, testInfo) => {
    await uploadFile(page, 'empty.csv')
    // Stays on home page — parse error
    await expect(page.getByText('CSV file is empty')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '03-empty-file.png') })
  })

  test('04 - malformed CSV', async ({ page }, testInfo) => {
    await uploadFile(page, 'malformed-csv.csv')
    await waitForSplitsPage(page)
    // Should show warning for skipped rows (some valid codes exist)
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '04-malformed-csv.png') })
  })

  test('05 - invalid headers (unrecognized column names)', async ({ page }, testInfo) => {
    await uploadFile(page, 'invalid-headers.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('Missing')).toBeVisible()
    await expect(page.getByText('column mapping')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '05-invalid-headers.png') })
  })

  test('06 - missing code column', async ({ page }, testInfo) => {
    await uploadFile(page, 'missing-code-column.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('Missing')).toBeVisible()
    await expect(page.getByText('column mapping')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '06-missing-code-column.png') })
  })

  test('07 - missing data (empty cells)', async ({ page }, testInfo) => {
    await uploadFile(page, 'missing-data.csv')
    await waitForSplitsPage(page)
    // Should show warning for rows with missing codes
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '07-missing-data.png') })
  })

  test('08 - mixed valid and invalid codes', async ({ page }, testInfo) => {
    await uploadFile(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)
    // Warning banner with skipped rows and example invalid codes
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '08-mixed-valid-invalid.png') })
  })

  test('09 - no header row', async ({ page }, testInfo) => {
    await uploadFile(page, 'no-header-row.csv')
    await waitForSplitsPage(page)
    // Should show both: missing headers + missing column mapping
    await expect(page.getByText('Headers not found')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '09-no-header-row.png') })
  })

  test('10 - no valid codes', async ({ page }, testInfo) => {
    await uploadFile(page, 'no-valid-codes.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('No valid dancer codes found')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '10-no-valid-codes.png') })
  })

  test('11 - invalid code format', async ({ page }, testInfo) => {
    await uploadFile(page, 'invalid-code-format.csv')
    await waitForSplitsPage(page)
    await expect(page.getByText('No valid dancer codes found')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '11-invalid-code-format.png') })
  })
})

test.describe('Validation Interactions', () => {
  test('dismiss warning banner → secondary indicator appears', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFile(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)

    // Warning banner visible
    await expect(page.getByText('skipped')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '12-warning-before-dismiss.png') })

    // Dismiss the banner
    await page.getByRole('button', { name: 'Dismiss' }).click()

    // Secondary indicator should appear with "dismissed" text
    await expect(page.getByText('dismissed')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '13-warning-after-dismiss.png') })
  })

  test('click Review → column mapping dialog opens', async ({ page }, testInfo) => {
    await page.goto('/')
    await uploadFile(page, 'mixed-valid-invalid.csv')
    await waitForSplitsPage(page)

    await expect(page.getByText('skipped')).toBeVisible()

    // Click Review button on the validation banner
    await page.getByRole('button', { name: 'Review' }).click()

    // Column mapping dialog should open
    await expect(page.getByText('Column Mapping')).toBeVisible()
    await page.screenshot({ path: screenshotPath(testInfo, '14-column-mapping-dialog.png') })
  })
})
