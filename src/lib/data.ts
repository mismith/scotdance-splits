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

// Age categorization from CSV data
export function categorizeData(data: string[][], colIndexes: Record<string, number>): Record<string, Record<string, number>> {
  return data.reduce(
    (acc, row) => {
      // Use Highland Scrutineer code format (e.g., P08, B12)
      const cell = row[colIndexes.code]
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
}

// Get partitioned age counts using linear partitioning algorithm
export function getPartitionedAgeCounts(ageCounts: [number, number][], numPartitions: number): [number[], number][] {
  const counts = ageCounts.map(([, count]) => count)
  const partitionedCounts: number[][] = partition(
    counts,
    Math.min(Math.max(1, numPartitions), ageCounts.length),
  )

  const result: [number[], number][] = []
  let index = 0
  partitionedCounts.forEach((partitionedCount, i) => {
    const range = [0, Infinity]
    let count = 0
    partitionedCount.forEach((_, j) => {
      const age = ageCounts[index][0]
      if (j === 0 && (i || (numPartitions > 1 && age === 4))) {
        range[0] = age
      }
      if (
        j === partitionedCount.length - 1 &&
        (i < partitionedCounts.length - 1 || (numPartitions > 1 && age === 6))
      ) {
        range[1] = age
      }
      count += ageCounts[index][1]
      index++
    })
    result.push([range, count])
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
  
  const targetDancersPerGroup = Math.max(
    totalDancers / averageDancersPerAge,
    maxDancersPerAge,
  )
  
  const min = { diff: Infinity, numPartitions: 1 }
  for (let i = 1; i < ageCountsArray.length; i++) {
    const partitionedAgeCounts = getPartitionedAgeCounts(ageCountsArray, i)
    const avg = partitionedAgeCounts.reduce((sum, [, count]) => sum + count, 0) / partitionedAgeCounts.length
    const diff = Math.abs(avg - targetDancersPerGroup)
    if (diff < min.diff) {
      min.diff = diff
      min.numPartitions = i
    }
  }
  return min.numPartitions
}

// Automatically partition all categories
export function autoPartitionCategories(categories: Record<string, Record<string, number>>): Record<string, [number, number][]> {
  const partitionedCategories: Record<string, [number, number][]> = {}
  
  Object.keys(categories).forEach(categoryCode => {
    const ageCountsArray = Object.entries(categories[categoryCode])
      .map(([age, count]) => [Number(age), count] as [number, number])
      .sort(([ageA], [ageB]) => ageA - ageB)
    
    const optimalGroups = getDefaultNumAgeGroups(ageCountsArray)
    const partitionedAgeCounts = getPartitionedAgeCounts(ageCountsArray, optimalGroups)
    
    partitionedCategories[categoryCode] = partitionedAgeCounts.map(([ageRange]) => ageRange as [number, number])
  })
  
  return partitionedCategories
}