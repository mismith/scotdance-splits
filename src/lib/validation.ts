import {
  INPUT_COLUMNS,
  type InputColumn,
  isSynthesisMode,
  resolveCategoryCode,
} from './input'

// Validation issue with optional cell-level details
export interface ValidationIssue {
  type:
    | 'invalid-codes'
    | 'missing-codes'
    | 'no-valid-codes'
    | 'missing-column-mapping'
    | 'missing-competition-date'
    | 'unrecognized-category'
    | 'synthesis-no-valid-codes'
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
 * Code column is conditionally required: not needed if synthesis columns are available
 */
export function validateColumnMapping(
  colIndexes: Record<string, number>,
  competitionDate?: Date,
): ValidationIssue[] {
  const errors: ValidationIssue[] = []

  const hasCode = colIndexes.code !== -1
  const canSynthesize = isSynthesisMode(colIndexes)

  // Code is required unless synthesis columns are present
  if (!hasCode && !canSynthesize) {
    errors.push({
      type: 'missing-column-mapping',
      severity: 'error',
      message:
        'Missing Highland Scrutineer code column mapping. Alternatively, map Category + Age or Birthday columns to generate codes.',
    })
  }

  // If using birthday for synthesis (birthday mapped, age not mapped) but no competition date
  if (
    !hasCode &&
    canSynthesize &&
    colIndexes.age === -1 &&
    colIndexes.birthday !== -1 &&
    !competitionDate
  ) {
    errors.push({
      type: 'missing-competition-date',
      severity: 'error',
      message: 'Competition date is required to calculate ages from birthdays',
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
  // Only create warnings if we have SOME valid codes (otherwise no-valid-codes error will handle it)
  if (validCodeCount > 0) {
    if (invalidCodeCells.length > 0) {
      const uniqueValues = [...new Set(invalidCodeCells.map((c) => c.value))]
      const examples = uniqueValues
        .slice(0, 3)
        .map((v) => `"${v}"`)
        .join(', ')

      errors.push({
        type: 'invalid-codes',
        severity: 'warning',
        message: `${invalidCodeCells.length} row${invalidCodeCells.length > 1 ? 's' : ''} skipped (invalid codes like ${examples})`,
        cells: invalidCodeCells,
      })
    }

    if (missingCodeCells.length > 0) {
      errors.push({
        type: 'missing-codes',
        severity: 'warning',
        message: `${missingCodeCells.length} row${missingCodeCells.length > 1 ? 's' : ''} with no code ${missingCodeCells.length > 1 ? 'were' : 'was'} skipped`,
        cells: missingCodeCells,
      })
    }
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
 * Validate synthesized codes and track issues with source columns
 */
export function validateSynthesizedCodes(
  data: string[][],
  colIndexes: Record<string, number>,
  resolvedCodes: string[],
): ValidationIssue[] {
  const errors: ValidationIssue[] = []
  const unrecognizedCategories: { rowIndex: number; colIndex: number; value: string }[] = []
  let validCount = 0

  data.forEach((row, index) => {
    const code = resolvedCodes[index]
    if (code && /^[PBNIRX]\d{2}$/.test(code)) {
      validCount++
      return
    }

    // Diagnose why this row failed — track unrecognized category values
    if (colIndexes.category !== -1) {
      const cat = row[colIndexes.category]
      if (cat && !resolveCategoryCode(cat)) {
        unrecognizedCategories.push({
          rowIndex: index,
          colIndex: colIndexes.category,
          value: cat,
        })
      }
    }
  })

  if (unrecognizedCategories.length > 0 && validCount > 0) {
    const unique = [...new Set(unrecognizedCategories.map((c) => c.value))]
    errors.push({
      type: 'unrecognized-category',
      severity: 'warning',
      message: `${unrecognizedCategories.length} row${unrecognizedCategories.length > 1 ? 's' : ''} with unrecognized category: ${unique.slice(0, 3).map((v) => `"${v}"`).join(', ')}`,
      cells: unrecognizedCategories,
    })
  }

  if (validCount === 0 && data.length > 0) {
    errors.push({
      type: 'synthesis-no-valid-codes',
      severity: 'error',
      message:
        'No valid codes could be generated. Check your Category and Age/Birthday column mappings.',
      cells: unrecognizedCategories,
    })
  }

  return errors
}

/**
 * Central validation orchestrator
 * Single source of truth for all input data validation
 */
export function validateInputData(
  csvData: string[][],
  colIndexes: Record<string, number>,
  hasHeaderRow: boolean,
  resolvedCodes?: string[],
  competitionDate?: Date,
): ValidationIssue[] {
  const errors: ValidationIssue[] = []

  // If no CSV data, no validation needed
  if (!csvData || csvData.length === 0) {
    return []
  }

  // Validate column mapping completeness
  const columnMappingErrors = validateColumnMapping(colIndexes, competitionDate)
  errors.push(...columnMappingErrors)

  // Extract data rows (skip headers if present)
  const dataRows = hasHeaderRow ? csvData.slice(1) : csvData

  if (colIndexes.code !== -1 && dataRows.length > 0) {
    // Direct mode: validate code column values
    const { errors: codeErrors } = validateCodes(dataRows, colIndexes.code)
    errors.push(...codeErrors)
  } else if (resolvedCodes && dataRows.length > 0) {
    // Synthesis mode: validate synthesized codes
    const synthErrors = validateSynthesizedCodes(dataRows, colIndexes, resolvedCodes)
    errors.push(...synthErrors)
  }

  return errors
}
