import { INPUT_COLUMNS, type InputColumn } from './input'

// Validation issue with optional cell-level details
export interface ValidationIssue {
  type:
    | 'invalid-codes'
    | 'missing-codes'
    | 'no-valid-codes'
    | 'missing-column-mapping'
    | 'parse-error'
  severity: 'error' | 'warning'
  message: string // Summary message with examples
  cells?: {
    // Optional - only for cell-level issues
    rowIndex: number // 0-based index in data array
    colIndex: number // Column position in CSV
    value: string // The problematic value
  }[]
}

/**
 * Detect if first row contains headers by matching against INPUT_COLUMNS regexes
 * Single source of truth for header detection
 */
export function detectHeaders(potentialHeaders: string[]): boolean {
  return potentialHeaders.some((header) =>
    INPUT_COLUMNS.some((col: InputColumn) => col.regex.test(header)),
  )
}

/**
 * Validate column mapping completeness
 * Returns error if required columns are unmapped
 */
export function validateColumnMapping(colIndexes: Record<string, number>): ValidationIssue[] {
  const errors: ValidationIssue[] = []

  // Check that all required columns are mapped (not -1)
  const requiredColumns = INPUT_COLUMNS.filter((col) => col.required).map((col) => col.id)
  const unmappedColumns = requiredColumns.filter((col) => colIndexes[col] === -1)

  if (unmappedColumns.length > 0) {
    // Create specific error message with missing column names
    const missingNames = unmappedColumns.map((col) => {
      const inputCol = INPUT_COLUMNS.find((c) => c.id === col)
      return inputCol?.name || col
    })

    const missingText =
      missingNames.length === 1
        ? missingNames[0]
        : missingNames.length === 2
          ? `${missingNames[0]} and ${missingNames[1]}`
          : `${missingNames.slice(0, -1).join(', ')}, and ${missingNames[missingNames.length - 1]}`

    errors.push({
      type: 'missing-column-mapping',
      severity: 'error',
      message: `Missing ${missingText} column mapping`,
    })
  }

  return errors
}

/**
 * Validate scrutineer code format and track problematic cells
 * Returns validation issues for invalid/missing codes
 */
export function validateCodes(
  data: string[][],
  codeColIndex: number,
): {
  errors: ValidationIssue[]
  validCodeCount: number
  invalidCodeCells: { rowIndex: number; colIndex: number; value: string }[]
  missingCodeCells: { rowIndex: number; colIndex: number; value: string }[]
} {
  const errors: ValidationIssue[] = []
  const invalidCodeCells: { rowIndex: number; colIndex: number; value: string }[] = []
  const missingCodeCells: { rowIndex: number; colIndex: number; value: string }[] = []
  let validCodeCount = 0

  // Collection phase - scan all rows and track problematic cells
  data.forEach((row, index) => {
    const cell = row[codeColIndex]

    if (!cell || cell.trim() === '') {
      missingCodeCells.push({
        rowIndex: index,
        colIndex: codeColIndex,
        value: cell || '',
      })
    } else if (/^[PBNIRX]\d{2}$/.test(cell)) {
      // Valid Highland Scrutineer code (e.g., P08, B12)
      validCodeCount++
    } else {
      invalidCodeCells.push({
        rowIndex: index,
        colIndex: codeColIndex,
        value: cell,
      })
    }
  })

  // Generation phase - create ValidationIssue objects with messages and cells
  const totalSkipped = invalidCodeCells.length + missingCodeCells.length

  // Only create warning if we have SOME valid codes (otherwise no-valid-codes error will handle it)
  if (totalSkipped > 0 && validCodeCount > 0) {
    // Get examples from invalid codes first, then missing if needed
    const exampleCells = [
      ...invalidCodeCells.slice(0, 3),
      ...missingCodeCells.slice(0, Math.max(0, 3 - invalidCodeCells.length)),
    ].slice(0, 3)

    const examples = exampleCells.map((c) => `"${c.value || '(empty)'}"`).join(', ')

    errors.push({
      type: 'invalid-codes',
      severity: 'warning',
      message: `${totalSkipped} row${totalSkipped > 1 ? 's' : ''} skipped (invalid codes like ${examples})`,
      cells: [...invalidCodeCells, ...missingCodeCells],
    })
  }

  // Critical error: no valid codes at all (blocking)
  if (validCodeCount === 0 && data.length > 0) {
    errors.push({
      type: 'no-valid-codes',
      severity: 'error',
      message:
        'No valid dancer codes found. Ensure codes start with P, B, N, I, R, or X followed by exactly 2 digits',
      cells: [...invalidCodeCells, ...missingCodeCells],
    })
  }

  return { errors, validCodeCount, invalidCodeCells, missingCodeCells }
}

/**
 * Central validation orchestrator
 * Single source of truth for all input data validation
 */
export function validateInputData(
  csvData: string[][],
  colIndexes: Record<string, number>,
  hasHeaderRow: boolean,
): ValidationIssue[] {
  const errors: ValidationIssue[] = []

  // If no CSV data, no validation needed
  if (!csvData || csvData.length === 0) {
    return []
  }

  // Validate column mapping completeness
  const columnMappingErrors = validateColumnMapping(colIndexes)
  errors.push(...columnMappingErrors)

  // Extract data rows (skip headers if present)
  const dataRows = hasHeaderRow ? csvData.slice(1) : csvData

  // Validate scrutineer codes if code column is mapped
  if (colIndexes.code !== -1 && dataRows.length > 0) {
    const { errors: codeErrors } = validateCodes(dataRows, colIndexes.code)
    errors.push(...codeErrors)
  }

  return errors
}
