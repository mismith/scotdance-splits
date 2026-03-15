import { unparse } from 'papaparse'
import { CATEGORY_CODE_NAMES, CATEGORY_ORDER, type Partition, getAgeGroupName } from './input'

export type BibNumberingMode = 'global' | 'per-category' | 'per-group'

export const DEFAULT_MIN_BIB = 100

export interface BibRange {
  partitionKey: string
  categoryCode: string
  ageRange: [number, number]
  label: string
  startBib: number
  dancerCount: number
}

export interface ExportSettings {
  minBibNumber: number
  bibNumberingMode: BibNumberingMode
  bibGroupRanges: BibRange[]
  bibCategoryRanges: BibRange[]
  isPrintingYears: boolean
  includeCountry: boolean
  combineNames: boolean
}

// Format a single dancer row for export
function formatDancerRow(
  row: string[],
  bibNumber: number,
  colIndexes: Record<string, number>,
  settings: ExportSettings,
): (string | number)[] {
  const firstName =
    row[colIndexes.firstName] || (!row[colIndexes.lastName] && row[colIndexes.fullName]) || ''
  const lastName = row[colIndexes.lastName] || ''
  const nameParts = []
  if (settings.combineNames) {
    const fullName = [firstName, lastName].filter(Boolean).join(' ')
    nameParts.push(fullName)
  } else {
    nameParts.push(firstName, lastName)
  }

  const locationParts: string[] = []
  if (colIndexes.location !== -1 && row[colIndexes.location]) {
    locationParts.push(String(row[colIndexes.location]))
  }
  if (colIndexes.region !== -1 && row[colIndexes.region]) {
    locationParts.push(String(row[colIndexes.region]))
  }
  if (settings.includeCountry && colIndexes.country !== -1 && row[colIndexes.country]) {
    locationParts.push(String(row[colIndexes.country]))
  }
  const location = locationParts.join(', ')

  return [bibNumber, ...nameParts, location].filter(Boolean)
}

// Generate export-ready data structure
export function generateExportData(
  csvData: string[][],
  colIndexes: Record<string, number>,
  partitions: Record<string, Partition[]>,
  settings: ExportSettings,
  hasHeaderRow: boolean,
  resolvedCodes?: string[],
): (string | number)[][] {
  const data: (string | number)[][] = []

  // Prepare input data and resolved codes
  const inputData = hasHeaderRow ? csvData.slice(1) : csvData
  const codes = resolvedCodes ?? inputData.map((row) => row[colIndexes.code] ?? '')

  // Valid rows sorted by registration timestamp (ascending)
  const validRows = inputData
    .map((row, i) => ({ row, code: codes[i] }))
    .filter(({ row }) => row[colIndexes.firstName])
    .sort((a, b) =>
      (a.row[colIndexes.timestamp] || '').localeCompare(b.row[colIndexes.timestamp] || ''),
    )

  // Sort categories by the defined order: P, B, N, I, R, X
  const sortedPartitions = CATEGORY_ORDER.filter((categoryCode) => partitions[categoryCode])
    .flatMap((categoryCode) =>
      partitions[categoryCode].sort((a, b) => a.ageRange[0] - b.ageRange[0]),
    )

  // Step 1: Assign bib numbers based on mode
  const bibMap = new Map<string[], number>()

  if (settings.bibNumberingMode === 'per-group') {
    const rangeMap = new Map(settings.bibGroupRanges.map((r) => [r.partitionKey, r]))
    for (const partition of sortedPartitions) {
      const key = `${partition.categoryCode}|${partition.ageRange[0]}|${partition.ageRange[1]}`
      const startBib = rangeMap.get(key)?.startBib ?? settings.minBibNumber
      const matchingRows = validRows.filter(({ code }) => partition.codes.includes(code))
      matchingRows.forEach(({ row }, index) => {
        bibMap.set(row, startBib + (matchingRows.length - 1 - index))
      })
    }
  } else if (settings.bibNumberingMode === 'per-category') {
    const catRangeMap = new Map(settings.bibCategoryRanges.map((r) => [r.categoryCode, r]))
    for (const categoryCode of CATEGORY_ORDER.filter((code) => partitions[code])) {
      const startBib = catRangeMap.get(categoryCode)?.startBib ?? settings.minBibNumber
      const allCodes = sortedPartitions
        .filter((p) => p.categoryCode === categoryCode)
        .flatMap((p) => p.codes)
      const categoryRows = validRows.filter(({ code }) => allCodes.includes(code))
      categoryRows.forEach(({ row }, index) => {
        bibMap.set(row, startBib + (categoryRows.length - 1 - index))
      })
    }
  } else {
    // Global: all dancers numbered sequentially
    const totalCount = validRows.length
    validRows.forEach(({ row }, index) => {
      bibMap.set(row, settings.minBibNumber + (totalCount - 1 - index))
    })
  }

  // Step 2: Render all partitions with their assigned bibs
  for (const partition of sortedPartitions) {
    const matchingRows = validRows
      .filter(({ code }) => partition.codes.includes(code))
      .map(({ row }) => ({ row, bibNumber: bibMap.get(row)! }))
      .sort((a, b) => a.bibNumber - b.bibNumber)

    if (matchingRows.length === 0) continue
    if (data.length) data.push(['', '', '', ''])

    const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], settings.isPrintingYears)}`
    data.push([name, '', '', ''])

    data.push(...matchingRows.map(({ row, bibNumber }) => formatDancerRow(row, bibNumber, colIndexes, settings)))
  }

  return data
}

// Convert structured data to CSV string
export function convertToCSV(data: (string | number)[][]): string {
  return unparse(data)
}

// Build a partition key string from category code and age range
export function getPartitionKey(categoryCode: string, ageRange: [number, number]): string {
  return `${categoryCode}|${ageRange[0]}|${ageRange[1]}`
}

// Auto-calculate bib group ranges from sorted partitions
export function calculateBibGroupRanges(
  sortedPartitions: Partition[],
  dancerCountsByPartition: Map<string, number>,
  overrides: Record<string, number>,
  minBibNumber: number = DEFAULT_MIN_BIB,
  blockSize: number = 10,
): BibRange[] {
  const ranges: BibRange[] = []
  let runningStart = minBibNumber

  for (const partition of sortedPartitions) {
    const key = getPartitionKey(partition.categoryCode, partition.ageRange)
    const dancerCount = dancerCountsByPartition.get(key) ?? 0
    const startBib = overrides[key] ?? runningStart

    ranges.push({
      partitionKey: key,
      categoryCode: partition.categoryCode,
      ageRange: partition.ageRange,
      label: `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1])}`,
      startBib,
      dancerCount,
    })

    runningStart = Math.ceil((startBib + dancerCount) / blockSize) * blockSize
  }

  return ranges
}

// Auto-calculate bib category ranges (one range per category)
export function calculateBibCategoryRanges(
  categoryOrder: string[],
  dancerCountsByCategory: Map<string, number>,
  overrides: Record<string, number>,
  minBibNumber: number = DEFAULT_MIN_BIB,
  blockSize: number = 10,
): BibRange[] {
  const ranges: BibRange[] = []
  let runningStart = minBibNumber

  for (const categoryCode of categoryOrder) {
    const dancerCount = dancerCountsByCategory.get(categoryCode) ?? 0
    if (dancerCount === 0) continue
    const startBib = overrides[categoryCode] ?? runningStart

    ranges.push({
      partitionKey: categoryCode,
      categoryCode,
      ageRange: [0, Infinity],
      label: CATEGORY_CODE_NAMES[categoryCode] || categoryCode,
      startBib,
      dancerCount,
    })

    runningStart = Math.ceil((startBib + dancerCount) / blockSize) * blockSize
  }

  return ranges
}

// Download CSV data as a file
export function downloadCSV(data: string, filename: string = 'output') {
  const a = document.createElement('a')
  const blob = new Blob([data], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
