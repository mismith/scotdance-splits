import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import partition from 'linear-partitioning'
import { type ValidationIssue, detectHeaders, validateCodes } from './validation'

dayjs.extend(customParseFormat)

// Minimum number of dancers per age group (used by algorithm and UI warnings)
export const MIN_GROUP_SIZE = 5

// Supported date formats for birthday parsing (tried in order)
const DATE_FORMATS = [
  'YYYY-MM-DD',
  'YYYY/MM/DD',
  'MM/DD/YYYY',
  'M/D/YYYY',
  'DD/MM/YYYY',
  'D/M/YYYY',
  'DD-MM-YYYY',
  'DD.MM.YYYY',
]
export type { ValidationIssue } from './validation'

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

// Reverse mapping: category name variants → category code (case-insensitive lookup)
export const CATEGORY_NAME_TO_CODE: Record<string, string> = {
  primary: 'P',
  beginner: 'B',
  novice: 'N',
  intermediate: 'I',
  'restricted premier': 'R',
  restricted: 'R',
  premier: 'X',
  championship: 'X',
  open: 'X',
}

export function resolveCategoryCode(categoryName: string): string | undefined {
  return CATEGORY_NAME_TO_CODE[categoryName.trim().toLowerCase()]
}

// Calculate age on a given date from a birthday string
export function calculateAgeOnDate(
  birthdayStr: string,
  competitionDate: Date,
): number | undefined {
  const birthday = dayjs(birthdayStr, DATE_FORMATS, true)
  if (!birthday.isValid()) return undefined

  const compYear = competitionDate.getFullYear()
  const compMonth = competitionDate.getMonth() + 1
  const compDay = competitionDate.getDate()
  const birthMonth = birthday.month() + 1

  let age = compYear - birthday.year()
  if (compMonth < birthMonth || (compMonth === birthMonth && compDay < birthday.date())) {
    age--
  }
  return age >= 0 && age <= 99 ? age : undefined
}

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
  },
  {
    id: 'category',
    name: 'Category',
    regex: /^(dance[-_\. ]?)?category$|^class$|^level$/i,
  },
  {
    id: 'age',
    name: 'Age',
    regex: /^age(on(competition|day))?$/i,
  },
  {
    id: 'birthday',
    name: 'Birthday',
    regex: /(date[-_\. ]?of[-_\. ]?)?birth(day|date)?$|^dob$/i,
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

// Synthesis configuration for resolving codes from alternative columns
export interface SynthesisConfig {
  colIndexes: Record<string, number>
  competitionDate?: Date
}

// Check if synthesis mode is active (code column unmapped, but category + age/birthday available)
export function isSynthesisMode(colIndexes: Record<string, number>): boolean {
  return (
    colIndexes.code === -1 &&
    colIndexes.category !== -1 &&
    (colIndexes.age !== -1 || colIndexes.birthday !== -1)
  )
}

// Columns that are rendered inside the synthesis accordion, not the main field list
export const SYNTHESIS_COLUMN_IDS = ['category', 'age', 'birthday']

// Resolve a scrutineer code for a single row (direct or synthesized)
export function resolveCode(row: string[], config: SynthesisConfig): string {
  const { colIndexes, competitionDate } = config

  // Direct code takes priority
  if (colIndexes.code !== -1) {
    const directCode = row[colIndexes.code]
    if (directCode && /^[PBNIRX]\d{2}$/.test(directCode)) {
      return directCode
    }
  }

  // Synthesis mode: need category + (age or birthday)
  if (colIndexes.category === -1) return ''

  const categoryName = row[colIndexes.category]
  if (!categoryName) return ''

  const categoryCode = resolveCategoryCode(categoryName)
  if (!categoryCode) return ''

  // Try age column first
  let age: number | undefined
  if (colIndexes.age !== -1 && row[colIndexes.age]) {
    const parsed = parseInt(row[colIndexes.age], 10)
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 99) {
      age = parsed
    }
  }

  // Fall back to birthday column
  if (age === undefined && colIndexes.birthday !== -1 && row[colIndexes.birthday] && competitionDate) {
    age = calculateAgeOnDate(row[colIndexes.birthday], competitionDate)
  }

  if (age === undefined) return ''

  return `${categoryCode}${age.toString().padStart(2, '0')}`
}

// Build resolved codes array for all data rows
export function buildResolvedCodes(data: string[][], config: SynthesisConfig): string[] {
  return data.map((row) => resolveCode(row, config))
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
  resolvedCodes?: string[],
): CategorizeDataResult {
  const codes = resolvedCodes ?? data.map((row) => row[colIndexes.code] ?? '')

  // Validate codes only if reading from a direct code column (not synthesis)
  const errors: ValidationIssue[] = []
  if (!resolvedCodes && colIndexes.code !== -1) {
    const validationResult = validateCodes(data, colIndexes.code)
    errors.push(...validationResult.errors)
  }

  // Categorization - build category -> age -> count map
  const categories = data.reduce(
    (acc, _row, index) => {
      const cell = codes[index]

      // Only process valid Highland Scrutineer codes (e.g., P08, B12)
      if (cell && /^[PBNIRX]\d{2}$/.test(cell)) {
        const categoryCode = cell.substring(0, 1)
        const age = cell.substring(1)
        acc[categoryCode] = acc[categoryCode] || {}
        acc[categoryCode][age] = (acc[categoryCode][age] || 0) + 1
      }
      return acc
    },
    {} as Record<string, Record<string, number>>,
  )

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

  const min = { diff: Infinity, numPartitions: 1, meetsMinSize: false }
  for (let i = 1; i < ageCountsArray.length; i++) {
    const partitionedAgeCounts = getPartitionedAgeCounts(ageCountsArray, i)
    const avg =
      partitionedAgeCounts.reduce((sum, [, count]) => sum + count, 0) / partitionedAgeCounts.length
    const diff = Math.abs(avg - targetDancersPerGroup)
    const meetsMinSize = partitionedAgeCounts.every(([, count]) => count >= MIN_GROUP_SIZE)

    // Prefer candidates where all groups meet minimum size; among equal, prefer lower diff
    if (
      (meetsMinSize && !min.meetsMinSize) ||
      (meetsMinSize === min.meetsMinSize && diff < min.diff)
    ) {
      min.diff = diff
      min.numPartitions = i
      min.meetsMinSize = meetsMinSize
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

  // Detect if first row is headers using centralized validation
  const potentialHeaders = csvData[0]
  const hasHeaderRow = detectHeaders(potentialHeaders)

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
