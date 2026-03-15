import { unparse } from 'papaparse'
import { CATEGORY_CODE_NAMES, CATEGORY_ORDER, type Partition, getAgeGroupName } from './input'

export type BibNumberingMode = 'global' | 'per-group'

export interface BibGroupRange {
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
  bibGroupRanges: BibGroupRange[]
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

  if (settings.bibNumberingMode === 'per-group') {
    // Per-group mode: each partition gets its own bib range
    const rangeMap = new Map(settings.bibGroupRanges.map((r) => [r.partitionKey, r]))

    sortedPartitions.forEach((partition) => {
      const partitionKey = `${partition.categoryCode}|${partition.ageRange[0]}|${partition.ageRange[1]}`
      const range = rangeMap.get(partitionKey)
      const startBib = range?.startBib ?? settings.minBibNumber

      const matchingRows = validRows.filter(({ code }) => partition.codes.includes(code))
      if (matchingRows.length === 0) return

      if (data.length) data.push(['', '', '', ''])

      const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], settings.isPrintingYears)}`
      data.push([name, '', '', ''])

      // First registered → highest bib in range, sorted ascending for display
      const numbered = matchingRows.map(({ row }, index) => ({
        row,
        bibNumber: startBib + (matchingRows.length - 1 - index),
      }))
      numbered.sort((a, b) => a.bibNumber - b.bibNumber)

      data.push(...numbered.map(({ row, bibNumber }) => formatDancerRow(row, bibNumber, colIndexes, settings)))
    })
  } else {
    // Global mode: all dancers numbered from minBibNumber, first registered = highest
    const totalCount = validRows.length
    const numberedCSV = validRows.map(({ row, code }, index) => ({
      row,
      code,
      bibNumber: settings.minBibNumber + (totalCount - 1 - index),
    }))
    numberedCSV.sort((a, b) => a.bibNumber - b.bibNumber)

    sortedPartitions.forEach((partition) => {
      const matchingRows = numberedCSV.filter(({ code }) => partition.codes.includes(code))
      if (matchingRows.length === 0) return

      if (data.length) data.push(['', '', '', ''])

      const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], settings.isPrintingYears)}`
      data.push([name, '', '', ''])

      data.push(...matchingRows.map(({ row, bibNumber }) => formatDancerRow(row, bibNumber, colIndexes, settings)))
    })
  }

  return data
}

// Convert structured data to CSV string
export function convertToCSV(data: (string | number)[][]): string {
  return unparse(data)
}

// Calculate default minimum bib number (starting bib)
export function calculateDefaultMinBib(): number {
  return 100
}

// Build a partition key string from category code and age range
export function getPartitionKey(categoryCode: string, ageRange: [number, number]): string {
  return `${categoryCode}|${ageRange[0]}|${ageRange[1]}`
}

export const BIB_BLOCK_SIZE = 10

// Auto-calculate bib group ranges from sorted partitions
export function calculateBibGroupRanges(
  sortedPartitions: Partition[],
  dancerCountsByPartition: Map<string, number>,
  overrides: Record<string, number>,
  minBibNumber: number = 100,
  blockSize: number = BIB_BLOCK_SIZE,
): BibGroupRange[] {
  const ranges: BibGroupRange[] = []
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
