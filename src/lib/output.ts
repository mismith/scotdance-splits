import { unparse } from 'papaparse'
import { CATEGORY_CODE_NAMES, getAgeGroupName, type Partition } from './input'

export interface ExportSettings {
  maxBibNumber: number
  isPrintingYears: boolean
  includeCountry: boolean
}

// Generate export-ready data structure
export function generateExportData(
  csvData: string[][],
  colIndexes: Record<string, number>,
  partitions: Record<string, Partition[]>,
  settings: ExportSettings,
  hasHeaderRow: boolean,
): (string | number)[][] {
  const data: (string | number)[][] = []

  // Create numbered CSV with bib numbers based on registration order
  const inputData = hasHeaderRow ? csvData.slice(1) : csvData
  const numberedCSV = inputData
    .filter((row) => row[colIndexes.firstName])
    .sort((rowA, rowB) =>
      (rowA[colIndexes.timestamp] || '').localeCompare(rowB[colIndexes.timestamp] || ''),
    )
    .map((row, index) => [...row, `${settings.maxBibNumber - index}`])

  Object.values(partitions)
    .flat()
    .forEach((partition) => {
      if (data.length) data.push(['', '', '', ''])

      const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], settings.isPrintingYears)}`
      data.push([name, '', '', ''])

      const rows = numberedCSV.filter((row) =>
        row.find((value) => partition.codes.includes(value as string)),
      )

      data.push(
        ...rows.map((row) => {
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

          return [
            row[row.length - 1], // bib number (last column)
            row[colIndexes.firstName] ||
              (!row[colIndexes.lastName] && row[colIndexes.fullName]) ||
              '',
            row[colIndexes.lastName] || '',
            locationParts.join(', '),
          ]
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
