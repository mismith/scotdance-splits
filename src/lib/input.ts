import partition from 'linear-partitioning'

// Highland dance category code names
export const CATEGORY_CODE_NAMES: Record<string, string> = {
  P: 'Primary',
  B: 'Beginner',
  N: 'Novice',
  I: 'Intermediate',
  R: 'Restricted Premier',
  X: 'Premier',
}

// Highland dance category order (progression from beginner to advanced)
export const CATEGORY_ORDER = ['P', 'B', 'N', 'I', 'R', 'X'] as const

// Age group name formatting
export function getAgeGroupName(minAge: number, maxAge: number, printYears = true) {
  const YEARS = printYears ? ' Years' : ''
  if (minAge === maxAge) {
    return `${minAge}${YEARS}`
  }
  if (minAge === 0 && maxAge === Infinity) {
    return 'All Ages'
  }
  if (minAge === 0) {
    return `${maxAge}${YEARS} & Under`
  }
  if (maxAge === Infinity) {
    return `${minAge}${YEARS} & Over`
  }
  if (minAge === maxAge - 1) {
    return `${minAge} & ${maxAge}${YEARS}`
  }
  return `${minAge} & Under ${maxAge + 1}${YEARS}`
}

// Input column configuration for CSV mapping
export type InputColumn = {
  id: string
  name: string
  regex: RegExp
  required?: boolean
  optional?: boolean
}

export const INPUT_COLUMNS: InputColumn[] = [
  {
    id: 'firstName',
    name: 'First name',
    regex: /f(irst)[-_\. ]?name/i,
  },
  {
    id: 'lastName',
    name: 'Last name',
    regex: /l(ast)[-_\. ]?name$/i,
  },
  {
    id: 'code',
    name: 'Highland Scrutineer code',
    regex: /(highland)?[-_\. ]?(scrutineer(ing)?)[-_\. ]?code$/i,
    required: true,
  },
  {
    id: 'timestamp',
    name: 'Registration date',
    regex: /(^|(entry|registration)[-_\. ]?)date$/i,
  },
  {
    id: 'location',
    name: 'City / Location',
    regex: /city|suburb/i,
    optional: true,
  },
  {
    id: 'region',
    name: 'Province / Region',
    regex: /province|state/i,
    optional: true,
  },
  {
    id: 'country',
    name: 'Country',
    regex: /country/i,
    optional: true,
  },
]

// Column mapping detection
export function detectColumnMapping(headers: string[]): Record<string, number> {
  const colIndexes: Record<string, number> = {}
  INPUT_COLUMNS.forEach((col) => {
    colIndexes[col.id] = headers.findIndex((header) => col.regex.test(header))
  })
  return colIndexes
}

// Validation issue with optional cell-level details
export interface ValidationIssue {
  type: 'invalid-codes' | 'missing-codes' | 'no-valid-codes' | 'missing-headers' | 'parse-error'
  severity: 'error' | 'warning'
  message: string  // Summary message with examples: "2 rows skipped (invalid codes like 'Z17', 'B1')"
  cells?: {        // Optional - only for cell-level issues
    rowIndex: number  // 0-based index in data array
    colIndex: number  // Column position in CSV
    value: string     // The problematic value
  }[]
}

// Age categorization result with validation errors
export interface CategorizeDataResult {
  categories: Record<string, Record<string, number>>
  errors: ValidationIssue[]
}

// Age categorization from CSV data
export function categorizeData(
  data: string[][],
  colIndexes: Record<string, number>,
): CategorizeDataResult {
  const errors: ValidationIssue[] = []

  // Collection phase - track all problematic cells
  const invalidCodeCells: { rowIndex: number; colIndex: number; value: string }[] = []
  const missingCodeCells: { rowIndex: number; colIndex: number; value: string }[] = []
  let validCodeCount = 0

  const categories = data.reduce(
    (acc, row, index) => {
      // Use Highland Scrutineer code format (e.g., P08, B12)
      const cell = row[colIndexes.code]

      if (!cell || cell.trim() === '') {
        missingCodeCells.push({
          rowIndex: index,
          colIndex: colIndexes.code,
          value: cell || '',
        })
      } else if (/^[PBNIRX]\d{2}$/.test(cell)) {
        const categoryCode = cell.substring(0, 1)
        const age = cell.substring(1)
        acc[categoryCode] = acc[categoryCode] || {}
        acc[categoryCode][age] = (acc[categoryCode][age] || 0) + 1
        validCodeCount++
      } else {
        invalidCodeCells.push({
          rowIndex: index,
          colIndex: colIndexes.code,
          value: cell,
        })
      }
      return acc
    },
    {} as Record<string, Record<string, number>>,
  )

  // Generation phase - create ValidationIssue objects with messages and cells
  const totalSkipped = invalidCodeCells.length + missingCodeCells.length

  // Combine invalid and missing codes into single issue with examples
  if (totalSkipped > 0) {
    // Get examples from invalid codes first, then missing if needed
    const exampleCells = [
      ...invalidCodeCells.slice(0, 3),
      ...missingCodeCells.slice(0, Math.max(0, 3 - invalidCodeCells.length)),
    ].slice(0, 3)

    const examples = exampleCells
      .map((c) => `"${c.value || '(empty)'}"`)
      .join(', ')

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
      message: 'No valid dancer codes found. Ensure codes start with P, B, N, I, R, or X followed by exactly 2 digits',
    })
  }

  return { categories, errors }
}

// Get partitioned age counts using linear partitioning algorithm
export function getPartitionedAgeCounts(
  ageCounts: [number, number][],
  numPartitions: number,
): [number[], number][] {
  const counts = ageCounts.map(([, count]) => count)
  const partitionedCounts: number[][] = partition(
    counts,
    Math.min(Math.max(1, numPartitions), ageCounts.length),
  )

  const result: [number[], number][] = []
  let index = 0
  partitionedCounts.forEach((partitionedCount, i) => {
    let minAge = 0
    let maxAge = Infinity
    let count = 0
    partitionedCount.forEach((_, j) => {
      const age = ageCounts[index][0]
      if (j === 0 && (i || (numPartitions > 1 && age === 4))) {
        minAge = age
      }
      if (
        j === partitionedCount.length - 1 &&
        (i < partitionedCounts.length - 1 || (numPartitions > 1 && age === 6))
      ) {
        maxAge = age
      }
      count += ageCounts[index][1]
      index++
    })
    // Create fresh immutable array for each range
    result.push([[minAge, maxAge], count])
  })
  return result
}

// Calculate optimal number of age groups for a category
export function getDefaultNumAgeGroups(ageCountsArray: [number, number][]): number {
  const totalDancers = ageCountsArray.reduce((sum, [, count]) => sum + count, 0)
  const averageDancersPerAge = ageCountsArray.length
    ? Math.ceil(totalDancers / ageCountsArray.length)
    : 0
  const maxDancersPerAge = ageCountsArray.reduce((max, [, count]) => Math.max(max, count), 0)

  const targetDancersPerGroup = Math.max(totalDancers / averageDancersPerAge, maxDancersPerAge)

  const min = { diff: Infinity, numPartitions: 1 }
  for (let i = 1; i < ageCountsArray.length; i++) {
    const partitionedAgeCounts = getPartitionedAgeCounts(ageCountsArray, i)
    const avg =
      partitionedAgeCounts.reduce((sum, [, count]) => sum + count, 0) / partitionedAgeCounts.length
    const diff = Math.abs(avg - targetDancersPerGroup)
    if (diff < min.diff) {
      min.diff = diff
      min.numPartitions = i
    }
  }
  return min.numPartitions
}

// Automatically partition all categories
export function autoPartitionCategories(
  categories: Record<string, Record<string, number>>,
): Record<string, [number, number][]> {
  const partitionedCategories: Record<string, [number, number][]> = {}

  Object.keys(categories).forEach((categoryCode) => {
    const ageCountsArray = Object.entries(categories[categoryCode])
      .map(([age, count]) => [Number(age), count] as [number, number])
      .sort(([ageA], [ageB]) => ageA - ageB)

    const optimalGroups = getDefaultNumAgeGroups(ageCountsArray)
    const partitionedAgeCounts = getPartitionedAgeCounts(ageCountsArray, optimalGroups)

    partitionedCategories[categoryCode] = partitionedAgeCounts.map(
      ([ageRange]) => [ageRange[0], ageRange[1]] as [number, number],
    )
  })

  return partitionedCategories
}

// Create partitions from processed data
export function createPartitions(
  categories: Record<string, Record<string, number>>,
  partitionedCategories: Record<string, [number, number][]>,
): Record<string, Partition[]> {
  const partitions: Record<string, Partition[]> = {}

  Object.keys(categories).forEach((categoryCode) => {
    const partitionedAgeRanges = partitionedCategories[categoryCode] || []
    const partitioned = partitionedAgeRanges.map(([minAge, maxAge]: [number, number]) => ({
      categoryCode,
      ageRange: [minAge, maxAge] as [number, number],
      codes: [] as string[],
    }))

    Object.keys(categories[categoryCode]).forEach((ageCode) => {
      const age = Number(ageCode)
      partitionedAgeRanges.forEach(([minAge, maxAge]: [number, number], index: number) => {
        if (minAge <= age && age <= maxAge) {
          const code = `${categoryCode}${ageCode}`
          partitioned[index].codes.push(code)
        }
      })
    })

    partitions[categoryCode] = partitioned
  })

  return partitions
}

// Partition interface for structured age group data
export interface Partition {
  categoryCode: string
  ageRange: [number, number]
  codes: string[]
}

// Data processing result interface
export interface ProcessedData {
  categories: Record<string, Record<string, number>>
  partitionedCategories: Record<string, [number, number][]>
  colIndexes: Record<string, number>
  hasHeaderRow: boolean
  errors: ValidationIssue[]
}

// Process raw CSV data into categories and partitions
export function processCSVData(csvData: string[][]): ProcessedData {
  if (!csvData || csvData.length === 0) {
    throw new Error('CSV file is empty')
  }

  const errors: ValidationIssue[] = []

  // Detect if first row is headers
  const potentialHeaders = csvData[0]
  const hasHeaderRow = potentialHeaders.some((header) =>
    INPUT_COLUMNS.some((col: InputColumn) => col.regex.test(header)),
  )

  // Error if headers not detected
  if (!hasHeaderRow) {
    errors.push({
      type: 'missing-headers',
      severity: 'error',
      message: 'Headers not found (expected FirstName, LastName, HighlandScrutineerCode)',
    })
  }

  // Auto-detect column mappings
  const headers = hasHeaderRow ? potentialHeaders : []
  const colIndexes = detectColumnMapping(headers)

  // Extract data rows (skip headers if present)
  const dataRows = hasHeaderRow ? csvData.slice(1) : csvData

  // Process data into categories
  const { categories, errors: categorizeErrors } = categorizeData(dataRows, colIndexes)

  // Combine errors
  errors.push(...categorizeErrors)

  // Auto-partition categories into age groups
  const partitionedCategories = autoPartitionCategories(categories)

  return {
    categories,
    partitionedCategories,
    colIndexes,
    hasHeaderRow,
    errors,
  }
}

// Fetch file text from a path
export async function fetchFile(path: string): Promise<string> {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Failed to fetch file from ${path}`)
  }
  return response.text()
}

// Fetch demo CSV text
export async function fetchDemoCSV(): Promise<string> {
  return fetchFile('/mock-data.csv')
}
