import { unparse } from 'papaparse'
import { CATEGORY_CODE_NAMES, CATEGORY_ORDER, type Partition, getAgeGroupName } from './input'

export interface ExportSettings {
  maxBibNumber: number
  isPrintingYears: boolean
  includeCountry: boolean
  combineNames: boolean
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

  // Create numbered CSV with bib numbers based on registration order
  const inputData = hasHeaderRow ? csvData.slice(1) : csvData
  const codes = resolvedCodes ?? inputData.map((row) => row[colIndexes.code] ?? '')

  // Zip rows with resolved codes, then filter/sort/number
  const numberedCSV = inputData
    .map((row, i) => ({ row, code: codes[i] }))
    .filter(({ row }) => row[colIndexes.firstName])
    .sort((a, b) =>
      (a.row[colIndexes.timestamp] || '').localeCompare(b.row[colIndexes.timestamp] || ''),
    )
    .map(({ row, code }, index) => ({
      row: [...row, `${settings.maxBibNumber - index}`],
      code,
    }))

  // Sort categories by the defined order: P, B, N, I, R, X
  const sortedPartitions = CATEGORY_ORDER.filter((categoryCode) => partitions[categoryCode]) // Only include categories that exist
    .flatMap((categoryCode) =>
      // Sort partitions within each category by minimum age
      partitions[categoryCode].sort((a, b) => a.ageRange[0] - b.ageRange[0]),
    )

  sortedPartitions.forEach((partition) => {
    const matchingRows = numberedCSV
      .filter(({ code }) => partition.codes.includes(code))
      .map(({ row }) => row)
    if (matchingRows.length === 0) return

    if (data.length) data.push(['', '', '', ''])

    const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], settings.isPrintingYears)}`
    data.push([name, '', '', ''])

    data.push(
      ...matchingRows.map((row) => {
        const bibNumber = row[row.length - 1] // bib number (last column)

        // Output name information
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

        // Build location column based on includeCountry setting
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
      }),
    )
  })

  return data
}

// Convert structured data to CSV string
export function convertToCSV(data: (string | number)[][]): string {
  return unparse(data)
}

// Calculate default max bib number based on valid rows that will get exported
export function calculateDefaultMaxBib(
  csvData: string[][],
  colIndexes: Record<string, number>,
  hasHeaderRow: boolean,
): number {
  // Count rows that will be exported (those with firstName)
  const inputData = hasHeaderRow ? csvData.slice(1) : csvData
  const validRowCount = inputData.filter((row) => row[colIndexes.firstName || 0]).length
  return Math.round((validRowCount + 50) / 100) * 100 + 100
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
