import { useLocalStorage, useMediaQuery } from '@vueuse/core'
import dayjs from 'dayjs'
import { parse } from 'papaparse'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { EntriesImport } from '@/lib/entries'
import {
  CATEGORY_ORDER,
  SCRUTINEERING_CODE_REGEX,
  autoPartitionCategories,
  buildResolvedCodes,
  categorizeData,
  createPartitions,
  detectColumnMapping,
  isSynthesisMode,
} from '@/lib/input'
import {
  type NumberingMode,
  type NumberRange,
  DEFAULT_MIN_NUMBER,
  calculateCategoryNumberRanges,
  calculateGroupNumberRanges,
  getPartitionKey,
} from '@/lib/output'
import type { Cell } from '@/lib/types'
import {
  type ValidationIssue,
  detectHeaders,
  validateCodes,
  validateColumnMapping,
  validateSynthesizedCodes,
} from '@/lib/validation'

export interface DancerData {
  firstName: string
  lastName: string
  location: string
  code: string
  age?: number
  dancerNumber?: number
  timestamp?: string
}

export const useAppStore = defineStore('app', () => {
  // Route transition state
  const isTransitioningRoute = ref(false)

  // File input state
  const inputFiles = ref<File[]>()
  const inputCSV = ref<Cell[][]>()
  const fileLoadError = ref<string>()
  const isLoadingInputFile = ref(false)

  // Processed data
  const categories = ref<Record<string, Record<string, number>>>()
  const partitionedCategories = ref<Record<string, [number, number][]>>()
  const processedDancers = ref<DancerData[]>([])

  // Manual partition overrides
  const manualPartitions = ref<Record<string, [number[], number][]>>({})

  // Input configuration
  const hasHeaderRow = useLocalStorage('hasHeaderRow', true)
  const inputHeaders = ref<string[]>([])
  const colIndexes = ref<Record<string, number>>({})

  // Destination travels with this in-memory dataset, never with another chosen file.
  const datasetRevision = ref(0)
  const entriesSource = ref<{ competitionId: string; name: string }>()

  // Synthesis state
  const competitionDate = useLocalStorage<string | undefined>('competitionDate', undefined)
  const resolvedCodes = ref<string[]>([])

  // Layout
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Keep legacy storage keys so existing numbering preferences survive the terminology change.
  // Export configuration
  const minNumber = ref<number>(DEFAULT_MIN_NUMBER)
  const numberingMode = useLocalStorage<NumberingMode>('bibNumberingMode', 'global')
  const groupNumberRangeOverrides = ref<Record<string, number>>({})
  const categoryNumberRangeOverrides = ref<Record<string, number>>({})
  const categoryNumberBlockSize = useLocalStorage('bibCategoryBlockSize', 10)
  const groupNumberBlockSize = useLocalStorage('bibGroupBlockSize', 10)
  const isPrintingYears = useLocalStorage('isPrintingYears', true)
  const includeCountry = useLocalStorage('includeCountry', false)
  const combineNames = useLocalStorage('combineNames', false)

  // Computed
  const competitionDateObj = computed(() => {
    if (!competitionDate.value) return undefined
    const d = dayjs(competitionDate.value, 'YYYY-MM-DD', true)
    if (!d.isValid()) return undefined
    return d.toDate()
  })

  const synthesisMode = computed(() => isSynthesisMode(colIndexes.value))

  const exportFilename = computed(() => {
    const name = inputFiles.value?.[0]?.name
    if (!name) return 'Splits'
    return name.replace(/\.csv$/i, '') + ' - Splits'
  })

  const hasData = computed(() => {
    return categories.value && Object.keys(categories.value).length > 0
  })

  const totalDancers = computed(() => {
    return processedDancers.value.length
  })

  // Shared: resolved data rows and codes for number range calculations
  const resolvedDataRowsAndCodes = computed(() => {
    if (!inputCSV.value) return null
    const rawData = inputCSV.value.map((row) => row.map((cell) => cell.value))
    const dataRows = hasHeaderRow.value ? rawData.slice(1) : rawData
    const codes = resolvedCodes.value.length
      ? resolvedCodes.value
      : dataRows.map((row) => row[colIndexes.value.code] ?? '')
    return { dataRows, codes }
  })

  // Computed number group ranges for per-group mode
  const groupNumberRanges = computed((): NumberRange[] => {
    if (!categories.value || !partitionedCategories.value || !resolvedDataRowsAndCodes.value) {
      return []
    }

    const parts = createPartitions(categories.value, partitionedCategories.value)
    const sortedPartitions = CATEGORY_ORDER.filter((code) => parts[code]).flatMap((code) =>
      parts[code].sort((a, b) => a.ageRange[0] - b.ageRange[0]),
    )

    const { codes } = resolvedDataRowsAndCodes.value
    const dancerCounts = new Map<string, number>()
    for (const partition of sortedPartitions) {
      const key = getPartitionKey(partition.categoryCode, partition.ageRange)
      dancerCounts.set(key, codes.filter((code) => partition.codes.includes(code)).length)
    }

    return calculateGroupNumberRanges(
      sortedPartitions,
      dancerCounts,
      groupNumberRangeOverrides.value,
      minNumber.value,
      groupNumberBlockSize.value,
    )
  })

  // Computed number category ranges for per-category mode
  const categoryNumberRanges = computed((): NumberRange[] => {
    if (!categories.value || !resolvedDataRowsAndCodes.value) return []

    const presentCategories = CATEGORY_ORDER.filter((code) => categories.value![code])

    const { codes } = resolvedDataRowsAndCodes.value
    const dancerCounts = new Map<string, number>()
    for (const categoryCode of presentCategories) {
      dancerCounts.set(categoryCode, codes.filter((code) => code.startsWith(categoryCode)).length)
    }

    return calculateCategoryNumberRanges(
      presentCategories,
      dancerCounts,
      categoryNumberRangeOverrides.value,
      minNumber.value,
      categoryNumberBlockSize.value,
    )
  })

  // Warnings for number range overlaps, keyed by partitionKey of each involved group
  const numberRangeWarnings = computed((): Map<string, string> => {
    const warnings = new Map<string, string>()
    const ranges =
      numberingMode.value === 'per-category' ? categoryNumberRanges.value : groupNumberRanges.value

    // Check all pairs for overlap (ranges may not be in startNumber order due to manual overrides)
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        const a = ranges[i]
        const b = ranges[j]
        const aEnd = a.startNumber + a.dancerCount - 1
        const bEnd = b.startNumber + b.dancerCount - 1

        if (a.startNumber <= bEnd && b.startNumber <= aEnd) {
          const message = `"${a.label}" (${a.startNumber}-${aEnd}) overlaps with "${b.label}" (${b.startNumber}-${bEnd})`
          if (!warnings.has(a.partitionKey)) {
            warnings.set(a.partitionKey, message)
          }
          if (!warnings.has(b.partitionKey)) {
            warnings.set(b.partitionKey, message)
          }
        }
      }
    }

    return warnings
  })

  // Reactively layer cell validation onto raw CSV data
  const validatedCSV = computed((): Cell[][] => {
    if (!inputCSV.value || inputCSV.value.length === 0) return []

    const rawData = inputCSV.value.map((row) => row.map((cell) => cell.value))
    const dataRows = hasHeaderRow.value ? rawData.slice(1) : rawData
    const codeColIndex = colIndexes.value.code

    const errorCellMap = new Map<string, 'error' | 'warning'>()
    if (codeColIndex !== undefined && codeColIndex !== -1) {
      // Direct mode: highlight invalid/missing code cells
      const { invalidCodeCells, missingCodeCells } = validateCodes(dataRows, codeColIndex)
      ;[...invalidCodeCells, ...missingCodeCells].forEach(({ rowIndex, colIndex }) => {
        const actualRowIndex = hasHeaderRow.value ? rowIndex + 1 : rowIndex
        errorCellMap.set(`${actualRowIndex},${colIndex}`, 'warning')
      })
    } else if (synthesisMode.value) {
      // Synthesis mode: highlight category cells where code couldn't be resolved
      resolvedCodes.value.forEach((code, index) => {
        if (!code || !SCRUTINEERING_CODE_REGEX.test(code)) {
          const actualRowIndex = hasHeaderRow.value ? index + 1 : index
          if (colIndexes.value.category !== -1) {
            errorCellMap.set(`${actualRowIndex},${colIndexes.value.category}`, 'warning')
          }
        }
      })

      // Highlight birthday cells when competition date is missing (all are unresolvable)
      if (
        colIndexes.value.birthday !== -1 &&
        colIndexes.value.age === -1 &&
        !competitionDateObj.value
      ) {
        dataRows.forEach((_, index) => {
          const actualRowIndex = hasHeaderRow.value ? index + 1 : index
          errorCellMap.set(`${actualRowIndex},${colIndexes.value.birthday}`, 'warning')
        })
      }
    }

    return inputCSV.value.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const severity = errorCellMap.get(`${rowIndex},${colIndex}`)
        return {
          value: cell.value,
          error: severity === 'error',
          warning: severity === 'warning',
        }
      }),
    )
  })

  const inputErrors = computed((): ValidationIssue[] => {
    const errors: ValidationIssue[] = []

    // Include critical file load errors
    if (fileLoadError.value) {
      errors.push({
        type: 'parse-error',
        severity: 'error',
        message: fileLoadError.value,
      })
      return errors
    }

    // If no CSV data, no validation errors to show
    if (!inputCSV.value || inputCSV.value.length === 0) {
      return []
    }

    const cellData = inputCSV.value
    // Extract raw string values for validation
    const rawData = cellData.map((row) => row.map((cell) => cell.value))

    // Validate column mapping completeness (with competition date for synthesis validation)
    const columnMappingErrors = validateColumnMapping(colIndexes.value, competitionDateObj.value)
    errors.push(...columnMappingErrors)

    // Extract data rows (skip headers if present, based on user's toggle)
    const dataRows = hasHeaderRow.value ? rawData.slice(1) : rawData

    if (colIndexes.value.code !== -1) {
      // Direct mode: validate code column values
      const { errors: categorizeErrors } = categorizeData(dataRows, colIndexes.value)
      errors.push(...categorizeErrors)
    } else if (synthesisMode.value) {
      // Synthesis mode: validate synthesized codes
      const synthErrors = validateSynthesizedCodes(dataRows, colIndexes.value, resolvedCodes.value)
      errors.push(...synthErrors)
    }

    return errors
  })

  // Actions
  function setInputData(files: File[], cellData: Cell[][]) {
    datasetRevision.value++
    entriesSource.value = undefined
    inputFiles.value = files
    inputCSV.value = cellData

    // Auto-detect headers (extract values from first row)
    if (cellData.length > 0) {
      inputHeaders.value = cellData[0].map((cell) => cell.value)
    }
  }

  function setLoading(loading: boolean) {
    isLoadingInputFile.value = loading
  }

  function setProcessedData(
    cats: Record<string, Record<string, number>>,
    partitions: Record<string, [number, number][]>,
    dancers?: DancerData[],
  ) {
    categories.value = cats
    partitionedCategories.value = partitions
    processedDancers.value = dancers || []
  }

  function clearAllData() {
    datasetRevision.value++
    entriesSource.value = undefined
    inputFiles.value = undefined
    inputCSV.value = undefined
    fileLoadError.value = undefined
    categories.value = undefined
    partitionedCategories.value = undefined
    processedDancers.value = []
    inputHeaders.value = []
    colIndexes.value = {}
    manualPartitions.value = {}
    groupNumberRangeOverrides.value = {}
    categoryNumberRangeOverrides.value = {}
    resolvedCodes.value = []
    competitionDate.value = undefined
  }

  function updateColIndexes(indexes: Record<string, number>) {
    colIndexes.value = indexes

    // Reprocess categories with new column mappings
    if (inputCSV.value && inputCSV.value.length > 0) {
      const cellData = inputCSV.value
      const rawData = cellData.map((row) => row.map((cell) => cell.value))
      const dataRows = hasHeaderRow.value ? rawData.slice(1) : rawData

      // Build resolved codes (handles both direct and synthesis modes)
      const codes = buildResolvedCodes(dataRows, {
        colIndexes: indexes,
        competitionDate: competitionDateObj.value,
      })
      resolvedCodes.value = codes

      const { categories: cats } = categorizeData(dataRows, indexes, codes)
      const partitionedCats = autoPartitionCategories(cats)

      setProcessedData(cats, partitionedCats)
      minNumber.value = DEFAULT_MIN_NUMBER
    }
  }

  function updateCompetitionDate(dateStr: string | undefined) {
    competitionDate.value = dateStr
    // Rebuild resolved codes with new competition date
    updateColIndexes(colIndexes.value)
  }

  function updateExportSettings(settings: {
    minNumber?: number
    numberingMode?: NumberingMode
    isPrintingYears?: boolean
    includeCountry?: boolean
    combineNames?: boolean
  }) {
    if (settings.minNumber !== undefined) {
      minNumber.value = settings.minNumber
    }
    if (settings.numberingMode !== undefined) {
      numberingMode.value = settings.numberingMode
    }
    if (settings.isPrintingYears !== undefined) {
      isPrintingYears.value = settings.isPrintingYears
    }
    if (settings.includeCountry !== undefined) {
      includeCountry.value = settings.includeCountry
    }
    if (settings.combineNames !== undefined) {
      combineNames.value = settings.combineNames
    }
  }

  // Manual partition methods
  function hasManualAdjustments(categoryCode: string): boolean {
    return categoryCode in manualPartitions.value
  }

  function setManualPartitions(categoryCode: string, partitions: [number[], number][]) {
    manualPartitions.value[categoryCode] = partitions
  }

  function clearManualPartitions(categoryCode: string) {
    delete manualPartitions.value[categoryCode]
  }

  async function loadFile(file: File) {
    fileLoadError.value = undefined
    setLoading(true)

    try {
      const results = await new Promise<{ data: string[][] }>((resolve, reject) => {
        // No `worker: true`: Papa's worker runs its own source via toString(), which breaks once minified
        parse(file, {
          complete: resolve,
          error: reject,
        })
      })

      // Filter out completely empty rows (e.g., trailing newlines)
      const rawData = (results.data as string[][]).filter((row) =>
        row.some((cell) => cell && cell.trim() !== ''),
      )
      if (!rawData || rawData.length === 0) {
        throw new Error('CSV file is empty')
      }

      // Auto-detect column mappings
      const potentialHeaders = rawData[0]
      const hasHeaders = detectHeaders(potentialHeaders)
      const headers = hasHeaders ? potentialHeaders : []
      const detectedColIndexes = detectColumnMapping(headers)

      // Convert string[][] to Cell[][] (validation flags are layered reactively via validatedCSV)
      const cellData: Cell[][] = rawData.map((row) =>
        row.map((value) => ({ value, error: false, warning: false })),
      )

      // Replace only after parsing succeeds. Old group/number overrides belong to the old list.
      manualPartitions.value = {}
      groupNumberRangeOverrides.value = {}
      categoryNumberRangeOverrides.value = {}
      hasHeaderRow.value = hasHeaders
      setInputData([file], cellData)

      // Update column indexes (this will reprocess data)
      updateColIndexes(detectedColIndexes)

      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse CSV file'
      fileLoadError.value = errorMessage
      return false
    } finally {
      setLoading(false)
    }
  }

  async function loadEntries(payload: EntriesImport) {
    const loaded = await loadFile(new File([payload.text], payload.name, { type: 'text/csv' }))
    if (!loaded) throw new Error(fileLoadError.value || 'Could not read the entries.')
    updateCompetitionDate(payload.date)
    entriesSource.value = {
      competitionId: payload.competitionId,
      name: payload.name.replace(/\.csv$/i, ''),
    }
  }

  return {
    datasetRevision,
    entriesSource,
    loadEntries,
    // Route transition
    isTransitioningRoute,

    // State
    inputFiles,
    validatedCSV,
    fileLoadError,
    inputErrors,
    isLoadingInputFile,
    categories,
    partitionedCategories,
    processedDancers,
    manualPartitions,
    hasHeaderRow,
    inputHeaders,
    colIndexes,
    minNumber,
    numberingMode,
    groupNumberRanges,
    groupNumberRangeOverrides,
    categoryNumberRanges,
    categoryNumberRangeOverrides,
    categoryNumberBlockSize,
    groupNumberBlockSize,
    numberRangeWarnings,
    isPrintingYears,
    includeCountry,
    combineNames,

    // Synthesis
    competitionDate,
    resolvedCodes,
    synthesisMode,
    updateCompetitionDate,

    // Layout
    isDesktop,

    // Computed
    exportFilename,
    hasData,
    totalDancers,

    // Actions
    setInputData,
    setLoading,
    setProcessedData,
    clearAllData,
    updateColIndexes,
    updateExportSettings,
    hasManualAdjustments,
    setManualPartitions,
    clearManualPartitions,
    loadFile,
  }
})
