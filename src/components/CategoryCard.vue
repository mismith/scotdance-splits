<template>
  <Card class="category-card" v-view-transition-name="`CategoryCard-${id}`">
    <CardContent class="px-6">
      <div class="relative">
        <!-- 4-column CSS Grid Layout -->
        <div
          ref="colsRef"
          :class="`grid gap-4 ${showDancers ? 'grid-cols-[1fr_80px_1fr_1fr]' : 'grid-cols-[1fr_80px_1fr]'}`"
        >
          <!-- Row 1: Header with title and controls -->
          <div class="flex items-center space-x-3">
            <CardTitle class="text-xl font-bold">{{ name }}</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <DancerCount :count="totalDancers" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ totalDancers }} dancers</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div></div>
          <!-- Empty spacer for curved lines column -->

          <div
            class="flex items-center gap-2 justify-center"
            v-view-transition-name="`CategoryCard-${id}-AgeGroupHeader`"
          >
            <div class="flex items-center gap-2">
              <input
                ref="groupsInputRef"
                type="number"
                v-model.number="numAgeGroups"
                :min="1"
                :max="ageCountsArray.length"
                class="text-center text-sm font-medium bg-transparent border-none outline-none focus:ring-0 p-0 text-foreground [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [field-sizing:content]"
                style="field-sizing: content"
                @blur="!numAgeGroups && (numAgeGroups = getDefaultNumAgeGroups())"
                @keyup.enter="($event.target as HTMLInputElement).blur()"
              />
              <span
                class="text-sm font-medium text-foreground cursor-pointer"
                @click="selectGroupsInput"
              >
                {{ pluralize(numAgeGroups || 1, 'group') }}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              @click="decrementGroups"
              :disabled="numAgeGroups <= 1"
              class="w-6 h-6 rounded-full p-0"
            >
              <Minus class="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              @click="incrementGroups"
              :disabled="numAgeGroups >= ageCountsArray.length"
              class="w-6 h-6 rounded-full p-0"
            >
              <Plus class="h-3 w-3" />
            </Button>
          </div>

          <div v-if="showDancers"></div>
          <!-- Empty spacer for dancers column -->

          <!-- Row 2: Content columns -->
          <!-- Individual ages column -->
          <div class="flex flex-col gap-2 self-start sticky top-12 will-change-transform">
            <div
              v-for="[age, count] in ageCountsArray"
              :key="age"
              ref="leftSideRef"
              v-view-transition-name="`CategoryCard-${id}-Age-${age}`"
              class="flex items-center justify-between p-3 text-sm bg-secondary/50 border border-border rounded-md hover:bg-secondary/70 transition-colors"
            >
              <span class="font-medium">Age {{ age }}</span>
              <DancerCount :count="count" :total="totalDancers" size="x-small" />
            </div>
          </div>

          <!-- Curved lines spacer -->
          <div></div>

          <!-- Age groups column -->
          <div class="flex flex-col gap-2">
            <div
              v-for="([[minAge, maxAge], count], index) in partitionedAgeCountsArray"
              :key="index"
              ref="rightSideRef"
              v-view-transition-name="`CategoryCard-${id}-AgeGroup-${index}`"
              :style="{ flex: `${count} 1 0` }"
              class="flex items-center justify-between p-3 text-sm bg-secondary/50 border border-border rounded-md hover:bg-secondary/70 transition-colors"
            >
              <span class="font-semibold text-foreground">{{
                getAgeGroupName(minAge, maxAge, isPrintingYears)
              }}</span>
              <DancerCount :count="count" :total="totalDancers" size="x-small" />
            </div>
          </div>

          <!-- Preview Dancers column -->
          <div v-if="showDancers" class="flex flex-col gap-2">
            <div
              v-for="([, count], index) in partitionedAgeCountsArray"
              :key="`preview-${index}`"
              :style="{ flex: `${count} 1 0` }"
              class="p-3 text-sm bg-muted/30 border border-border/50 rounded-md flex flex-col justify-start"
            >
              <div class="space-y-1">
                <div
                  v-for="dancer in getRealDancersForAgeGroup(index)"
                  :key="dancer.bibNumber"
                  class="flex items-center gap-2 text-xs"
                >
                  <span
                    class="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[2rem] text-center"
                  >
                    {{ dancer.bibNumber }}
                  </span>
                  <span class="truncate text-foreground flex-1"
                    >{{ dancer.firstName }} {{ dancer.lastName }}</span
                  >
                  <span class="truncate text-muted-foreground text-[10px]">{{
                    dancer.location
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SVG connections -->
        <svg
          v-if="rightSideRef?.length > 1"
          ref="svgRef"
          class="absolute inset-0 w-full h-full pointer-events-none will-change-auto"
          style="overflow: visible"
        ></svg>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { ref, computed, watch, inject, onMounted, onUnmounted, nextTick, useId } from 'vue'
import partition from 'linear-partitioning'
import { useAppStore } from '@/stores/app'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import DancerCount from '@/components/DancerCount.vue'
import { pluralize } from '@/lib/helpers'
import { getAgeGroupName, CATEGORY_CODE_NAMES } from '@/lib/input'
import { Minus, Plus } from 'lucide-vue-next'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  ages: {
    type: Object,
    required: true,
  },
  id: {
    type: String,
    default: () => useId(),
  },
})

const store = useAppStore()
const isPrintingYears = inject<boolean>('isPrintingYears')
const showDancers = inject('showDancers', ref(true))

const ageCountsArray = computed(() => {
  return Object.entries(props.ages)
    .map(([age, count]) => [Number(age), count])
    .sort(([ageA], [ageB]) => ageA - ageB)
})

const totalDancers = computed(() => {
  return ageCountsArray.value.reduce((sum, [, count]) => sum + count, 0)
})

const averageDancersPerAge = computed(() => {
  return ageCountsArray.value.length
    ? Math.ceil(totalDancers.value / ageCountsArray.value.length)
    : 0
})

const maxDancersPerAge = computed(() => {
  return ageCountsArray.value.reduce((max, [, count]) => Math.max(max, count), 0)
})

function getPartitionedAgeCounts(ageCounts: number[][], numPartitions: number) {
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
  // TODO: handle edge case where there are ties, so the number of groups doesn't exactly match the numPartitions requested
  // TODO: handle edge case where Premier needs to be split around/above 12 y/o, since steps change
  return result
}

function getAverage(array: number[]) {
  return array.reduce((sum, value) => sum + value, 0) / array.length
}

function getDefaultNumAgeGroups() {
  const targetDancersPerGroup = Math.max(
    totalDancers.value / averageDancersPerAge.value,
    maxDancersPerAge.value,
  )
  const min = { diff: Infinity, numPartitions: 1 }
  for (let i = 1; i < ageCountsArray.value.length; i++) {
    const partitionedAgeCounts = getPartitionedAgeCounts(ageCountsArray.value, i)
    const avg = getAverage(partitionedAgeCounts.map(([, count]) => count))
    const diff = Math.abs(avg - targetDancersPerGroup)
    if (diff < min.diff) {
      min.diff = diff
      min.numPartitions = i
    }
  }
  return min.numPartitions
}

const numAgeGroups = ref(getDefaultNumAgeGroups())
const partitionedAgeCountsArray = computed(() => {
  return getPartitionedAgeCounts(ageCountsArray.value, numAgeGroups.value)
})

function incrementGroups() {
  if (numAgeGroups.value < ageCountsArray.value.length) {
    numAgeGroups.value++
  }
}

function decrementGroups() {
  if (numAgeGroups.value > 1) {
    numAgeGroups.value--
  }
}

// Get real dancers for the specified age group from CSV data
function getRealDancersForAgeGroup(ageGroupIndex: number) {
  const inputData = store.inputCSV?.slice(store.hasHeaderRow ? 1 : 0) || []
  const ageRange = partitionedAgeCountsArray.value[ageGroupIndex]?.[0]

  if (!ageRange || !inputData.length) return []

  const [minAge, maxAge] = ageRange

  // First, create a global sorted list of all valid dancers for bib number calculation
  const allValidDancers = inputData
    .filter((row) => {
      const codeCol = store.colIndexes.code || -1
      if (codeCol === -1) return false
      const code = String(row[codeCol] || '')
      return /^[PBNIRX]\d{2}$/.test(code)
    })
    .sort((a, b) => {
      const timestampCol = store.colIndexes.timestamp || -1
      if (timestampCol === -1) return 0
      return String(a[timestampCol] || '').localeCompare(String(b[timestampCol] || ''))
    })

  // Filter dancers that fall within this age group
  const dancersInGroup = inputData
    .filter((row) => {
      const codeCol = store.colIndexes.code || -1

      if (codeCol === -1) return false

      const code = String(row[codeCol] || '')
      // Extract age and category from Highland Scrutineer code (e.g., P08 → P and 08)
      if (/^[PBNIRX]\d{2}$/.test(code)) {
        const categoryCode = code.charAt(0)
        const age = parseInt(code.substring(1))

        // Check if this row matches our category and age range
        // Find the Highland Scrutineer code that matches our category name
        const expectedCode =
          Object.keys(CATEGORY_CODE_NAMES).find(
            (code) => CATEGORY_CODE_NAMES[code] === props.name,
          ) || props.name.charAt(0)
        return age >= minAge && age <= maxAge && categoryCode === expectedCode
      }

      return false
    })
    .sort((a, b) => {
      // Sort by timestamp (registration order)
      const timestampCol = store.colIndexes.timestamp || -1
      if (timestampCol === -1) return 0
      return String(a[timestampCol] || '').localeCompare(String(b[timestampCol] || ''))
    })
    .map((row) => {
      // Build location from available columns
      const locationParts = []
      if (store.colIndexes.location !== -1) locationParts.push(row[store.colIndexes.location])
      if (store.colIndexes.region !== -1) locationParts.push(row[store.colIndexes.region])
      if (
        store.includeCountry &&
        store.colIndexes.country !== -1 &&
        row[store.colIndexes.country]
      ) {
        locationParts.push(row[store.colIndexes.country])
      }

      // Find this dancer's position in the overall sorted list to calculate bib number
      const globalIndex = allValidDancers.findIndex(
        (r) =>
          String(r[store.colIndexes.timestamp || 0] || '') ===
            String(row[store.colIndexes.timestamp || 0] || '') &&
          String(r[store.colIndexes.firstName || 0] || '') ===
            String(row[store.colIndexes.firstName || 0] || '') &&
          String(r[store.colIndexes.lastName || 0] || '') ===
            String(row[store.colIndexes.lastName || 0] || ''),
      )

      return {
        firstName: String(row[store.colIndexes.firstName || 0] || ''),
        lastName: String(row[store.colIndexes.lastName || 0] || ''),
        location: locationParts.filter(Boolean).join(', ') || 'Unknown',
        bibNumber: (store.maxBibNumber || 100) - (globalIndex !== -1 ? globalIndex : 0),
      }
    })

  return dancersInGroup
}

const colsRef = ref()
const leftSideRef = ref<HTMLElement[]>([])
const rightSideRef = ref<HTMLElement[]>([])
const svgRef = ref<SVGElement>()
const groupsInputRef = ref<HTMLInputElement>()

// Function to select the input text when clicking the label
function selectGroupsInput() {
  if (groupsInputRef.value) {
    groupsInputRef.value.select()
  }
}

function getCurvePath(rightSide: HTMLElement, rightSideIndex: number) {
  const maxAge = partitionedAgeCountsArray.value[rightSideIndex]?.[0]?.[1]
  const leftSideIndex = ageCountsArray.value.findIndex(([age]) => age === maxAge)
  const leftSide =
    leftSideRef.value[leftSideIndex === -1 ? leftSideRef.value.length - 1 : leftSideIndex]

  if (!colsRef.value || !leftSide || !rightSide) return ''

  const root = colsRef.value.getBoundingClientRect()
  const left = leftSide.getBoundingClientRect()
  const right = rightSide.getBoundingClientRect()

  // Get the next right element to calculate gap position
  const nextRightSide = rightSideRef.value[rightSideIndex + 1]
  const nextLeftSide = leftSideRef.value[leftSideIndex + 1]

  if (!nextRightSide) return ''

  const nextRight = nextRightSide.getBoundingClientRect()

  // Calculate positions for lines extending 12px from edges
  const leftX = -12 // Extend 12px beyond left edge
  const rightX = root.width + 12 // Extend 12px beyond right edge
  const leftCardEndX = left.left - root.left + left.width
  const rightCardStartX = right.left - root.left
  const midX = (leftCardEndX + rightCardStartX) / 2

  // Position left line in the middle of gap between left cards (if next exists, otherwise bottom)
  const leftY = nextLeftSide
    ? left.top -
      root.top +
      left.height +
      (nextLeftSide.getBoundingClientRect().top - left.top - left.height) / 2
    : left.top - root.top + left.height

  // Position right line in the middle of the gap between current and next right card
  const rightY =
    right.top - root.top + right.height + (nextRight.top - right.top - right.height) / 2

  // Create path: straight line from left edge to end of left card, curve in middle, straight line to right edge
  return `M ${leftX} ${leftY} L ${leftCardEndX} ${leftY} C ${midX} ${leftY}, ${midX} ${rightY}, ${rightCardStartX} ${rightY} L ${rightX} ${rightY}`
}

// Direct DOM manipulation - no Vue reactivity needed
let rafId: number | null = null
let isActive = false

function updateCurvesDirectly() {
  if (!isActive || !rightSideRef.value?.length || !svgRef.value) {
    rafId = requestAnimationFrame(updateCurvesDirectly)
    return
  }

  const svg = svgRef.value
  const curvesToRender = rightSideRef.value.slice(0, -1)

  // Ensure we have the right number of path elements
  while (svg.children.length < curvesToRender.length) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('class', 'stroke-primary fill-none stroke-2')
    path.setAttribute('stroke-linecap', 'round')
    svg.appendChild(path)
  }

  // Remove extra path elements if needed
  while (svg.children.length > curvesToRender.length) {
    svg.removeChild(svg.lastChild!)
  }

  // Update each path directly
  curvesToRender.forEach((el, index) => {
    const pathElement = svg.children[index] as SVGPathElement
    const newPath = getCurvePath(el, index)
    if (pathElement.getAttribute('d') !== newPath) {
      pathElement.setAttribute('d', newPath)
    }
  })

  rafId = requestAnimationFrame(updateCurvesDirectly)
}

onMounted(async () => {
  // Start continuous RAF loop for direct DOM updates
  await nextTick() // Wait for SVG ref to be available
  isActive = true
  rafId = requestAnimationFrame(updateCurvesDirectly)
})
onUnmounted(() => {
  isActive = false
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
})

const emit = defineEmits(['partition'])
watch(
  partitionedAgeCountsArray,
  (partitions) => {
    emit(
      'partition',
      partitions.map(([ageRange]) => ageRange),
    )
  },
  { immediate: true },
)
</script>
