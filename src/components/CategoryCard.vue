<template>
  <Card class="select-none py-3 md:py-6">
    <CardContent class="px-3 md:px-6">
      <div class="relative">
        <!-- 4-column CSS Grid Layout -->
        <div
          ref="colsRef"
          :class="`grid gap-y-4 grid-cols-[1fr_2rem_1fr_0] md:grid-cols-[1fr_80px_1fr_0] ${showDancers ? 'md:!grid-cols-[1fr_80px_1fr_1fr]' : ''}`"
        >
          <!-- Row 1: Header with title and controls -->
          <div class="flex items-center col-span-2 gap-2">
            <div class="flex flex-col md:flex-row md:items-center space-x-3">
              <CardTitle class="text-xl font-bold" style="view-transition-name: match-element">
                {{ name }}
              </CardTitle>
              <DancerCount :count="totalDancers" style="view-transition-name: match-element" />
            </div>

            <!-- Manual adjustment indicator -->
            <div v-if="hasCustomizations" class="flex items-center gap-2 flex-shrink-0 ml-auto">
              <Tooltip>
                <TooltipTrigger
                  class="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full hover:bg-accent/15 transition-colors"
                  @click="resetToDefaults"
                >
                  <span class="text-xs font-medium text-accent">Manual</span>
                  <Delete class="w-3 h-3 text-accent ml-1" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to recommended splits</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <!-- Flexible spacer to avoid curve gap -->
            <div class="shrink-0 w-6 md:w-22"></div>
          </div>

          <div class="grid grid-cols-[1fr_auto_1fr] items-center">
            <!-- Left spacer -->
            <div></div>

            <!-- Center controls -->
            <div class="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                @click="decrementGroups"
                :disabled="numAgeGroups <= 1"
                class="w-6 h-6 rounded-full p-0"
                :class="'[view-transition-name:match-element]'"
              >
                <Minus class="h-3 w-3" />
              </Button>
              <div class="flex items-center gap-2" :class="'[view-transition-name:match-element]'">
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
                <span class="text-sm font-medium text-foreground" @click="selectGroupsInput">
                  {{ pluralize(numAgeGroups || 1, 'group') }}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                @click="incrementGroups"
                :disabled="numAgeGroups >= ageCountsArray.length"
                class="w-6 h-6 rounded-full p-0"
                :class="'[view-transition-name:match-element]'"
              >
                <Plus class="h-3 w-3" />
              </Button>
            </div>

            <!-- Right reset button -->
            <div class="flex justify-end">
              <Tooltip v-if="hasNonStandardGroupCount">
                <TooltipTrigger asChild>
                  <div
                    class="flex items-center gap-1 px-2 py-1 bg-accent/10 rounded-full hover:bg-accent/15 transition-colors"
                    @click="resetGroupCount"
                  >
                    <span class="text-xs font-medium text-accent">Manual</span>
                    <Delete class="w-3 h-3 text-accent ml-1" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to recommended number of groups</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          <div />
          <!-- Empty spacer for dancers column -->

          <!-- Row 2: Content columns -->
          <!-- Individual ages column -->
          <div class="flex flex-col gap-2 self-start sticky top-16 will-change-transform">
            <div
              v-for="[age, count] in ageCountsArray"
              :key="age"
              ref="leftSideRef"
              class="p-3 text-sm bg-secondary/50 border border-border rounded-3xl select-text"
              :class="'[view-transition-name:match-element]'"
              style="view-transition-class: fixed-height"
            >
              <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                <span class="font-medium" :class="'[view-transition-name:match-element]'">
                  Age {{ age }}
                </span>
                <DancerCount
                  :count="count"
                  :total="totalDancers"
                  size="x-small"
                  style="view-transition-name: match-element"
                />
              </div>
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
              class="p-3 text-sm bg-secondary/50 border border-border rounded-3xl hover:bg-secondary/70 transition-all select-text"
              :class="'[view-transition-name:match-element]'"
              style="view-transition-class: fixed-height"
              :style="{ flex: `${count} 1 0` }"
              @click="openAgeGroupSheet(index)"
            >
              <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                <span
                  class="font-semibold text-foreground"
                  :class="'[view-transition-name:match-element]'"
                >
                  {{ getAgeGroupName(minAge, maxAge, isPrintingYears) }}
                </span>
                <DancerCount
                  :count="count"
                  :total="totalDancers"
                  size="x-small"
                  style="view-transition-name: match-element"
                />
              </div>
            </div>
          </div>

          <!-- Preview Dancers column -->
          <div class="hidden md:flex flex-col gap-2 md:ml-4">
            <template
              v-for="([, count], index) in partitionedAgeCountsArray"
              :key="`preview-${index}`"
            >
              <div
                v-if="showDancers"
                :style="{
                  flex: `${count} 1 0`,
                  viewTransitionName: `CategoryCard-${id}-DancersColumn-${index}`,
                  viewTransitionClass: 'fixed-height',
                }"
                class="p-3 text-sm bg-muted/30 border border-border/50 rounded-3xl flex flex-col justify-start select-text"
              >
                <DancerPreview :dancers="getRealDancersForAgeGroup(index)" />
              </div>
              <div
                v-else
                :style="{
                  flex: `${count} 1 0`,
                  viewTransitionName: `CategoryCard-${id}-DancersColumn-${index}`,
                  viewTransitionClass: 'fixed-height',
                }"
              ></div>
            </template>
          </div>
        </div>

        <!-- SVG connections -->
        <svg
          v-if="rightSideRef?.length > 1"
          ref="svgRef"
          class="absolute inset-0 w-full h-full pointer-events-none will-change-auto"
          style="overflow: visible"
        ></svg>

        <!-- Drag handles (one per boundary) -->
        <TransitionGroup
          enter-active-class="transition-transform duration-200 ease-out"
          leave-active-class="transition-transform duration-150 ease-in"
          enter-from-class="scale-y-0 scale-x-95"
          leave-to-class="scale-y-0 scale-x-95"
        >
          <div
            v-for="(pos, index) in dragHandlePositions"
            :key="index"
            v-show="showDragHandle && hoveredBoundaryIndex === index"
            class="max-sm:flex! absolute cursor-ns-resize z-20 h-3 flex items-center -mt-1.5 justify-center shadow transition-shadow"
            :class="`${index !== -1 && isBoundaryManual(index) ? 'bg-accent text-accent-foreground [&_path]:fill-accent' : 'bg-primary text-primary-foreground [&_path]:fill-primary'} ${isDragging && draggingBoundaryIndex === index ? (index !== -1 && isBoundaryManual(index) ? 'shadow-[0_0_20px_var(--accent)]' : 'shadow-[0_0_20px_var(--primary)]') : ''}`"
            :style="{
              left: pos.left + 24 + 'px',
              top: pos.top + 'px',
              width: pos.width - 48 + 'px',
            }"
            @mousedown="(e) => onDragStart(e, index)"
            @touchstart="(e) => onDragStart(e, index)"
            @mouseenter="onDragHandleHover"
            @mouseleave="onDragHandleLeave"
          >
            <div class="w-full h-full relative">
              <!-- Left horizontal bulge -->
              <svg
                class="absolute right-full top-0 w-6 h-full -mr-px"
                viewBox="0 0 12 12"
                preserveAspectRatio="none"
              >
                <path d="M12,0 C3,0 9,5 0,5 M0,5 0,7 C9,7 3,12 12,12 L12,0Z" />
              </svg>

              <!-- Right horizontal bulge -->
              <svg
                class="absolute left-full top-0 w-6 h-full -ml-px"
                viewBox="0 0 12 12"
                preserveAspectRatio="none"
              >
                <path d="M0,0 C9,0 3,5 12,5 M12,5 12,7 C3,7 9,12 0,12 L0,0Z" />
              </svg>

              <!-- Three dots centered -->
              <div class="flex gap-0.5 items-center justify-center h-full">
                <div class="w-1 h-1 rounded-full bg-current"></div>
                <div class="w-1 h-1 rounded-full bg-current"></div>
                <div class="w-1 h-1 rounded-full bg-current"></div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </CardContent>
  </Card>

  <!-- Mobile Dancer Sheet -->
  <Sheet v-model:open="showDancerSheet">
    <SheetContent side="bottom" class="md:hidden">
      <SheetHeader>
        <SheetTitle>{{ sheetTitle }}</SheetTitle>
      </SheetHeader>
      <div class="overflow-y-auto -mt-4">
        <div
          v-if="selectedAgeGroupIndex !== null"
          class="p-3 bg-muted/30 border border-border/50 rounded-3xl"
        >
          <DancerPreview :dancers="getRealDancersForAgeGroup(selectedAgeGroupIndex)" />
        </div>
        <div v-else class="text-center text-muted-foreground py-8">No dancers found</div>
      </div>
    </SheetContent>
  </Sheet>
</template>

<script lang="ts" setup>
import partition from 'linear-partitioning'
import { Delete, Minus, Plus } from 'lucide-vue-next'
import { computed, inject, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import { startViewTransition } from 'vue-view-transitions'
import { useAppStore } from '@/stores/app'
import DancerCount from '@/components/DancerCount.vue'
import DancerPreview from '@/components/DancerPreview.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { CATEGORY_CODE_NAMES, getAgeGroupName } from '@/lib/input'
import { pluralize } from '@/lib/utils'

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

// Sheet computed properties
const sheetTitle = computed(() => {
  if (selectedAgeGroupIndex.value !== null) {
    const ageRange = partitionedAgeCountsArray.value[selectedAgeGroupIndex.value]?.[0]
    if (ageRange) {
      const [minAge, maxAge] = ageRange
      const ageGroupName = getAgeGroupName(minAge, maxAge, !!isPrintingYears)
      return `${props.name} ${ageGroupName}`
    }
  }
  return `${props.name}`
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

// Get category code from component name
const categoryCode = computed(() => {
  return (
    Object.keys(CATEGORY_CODE_NAMES).find((code) => CATEGORY_CODE_NAMES[code] === props.name) ||
    props.name.charAt(0)
  )
})

// Effective partitions (manual overrides auto)
const effectivePartitions = computed(() => {
  return store.manualPartitions[categoryCode.value] || null
})

const partitionedAgeCountsArray = computed(() => {
  if (effectivePartitions.value) {
    // Manual partitions already in correct [number[], number][] format
    return effectivePartitions.value
  }
  // Otherwise use auto-calculated partitions
  return getPartitionedAgeCounts(ageCountsArray.value, numAgeGroups.value)
})

// Check if current state differs from default (only manual partitions, not group count changes)
const hasCustomizations = computed(() => {
  return store.hasManualAdjustments(categoryCode.value)
})

// Check if group count is non-standard
const hasNonStandardGroupCount = computed(() => {
  return numAgeGroups.value !== getDefaultNumAgeGroups()
})

// Check if a specific boundary is manual (only for dragged partitions, not group count changes)
function isBoundaryManual(boundaryIndex: number): boolean {
  // Only check if this specific boundary differs from default (ignore group count changes)
  const defaultPartitions = getPartitionedAgeCounts(ageCountsArray.value, numAgeGroups.value)
  const currentBoundary = partitionedAgeCountsArray.value[boundaryIndex]?.[0]?.[1]
  const defaultBoundary = defaultPartitions[boundaryIndex]?.[0]?.[1]
  return currentBoundary !== defaultBoundary
}

async function incrementGroups() {
  if (numAgeGroups.value < ageCountsArray.value.length) {
    const viewTransition = startViewTransition()
    await viewTransition.captured
    numAgeGroups.value++
    // Clear manual adjustments when changing group count
    store.clearManualPartitions(categoryCode.value)
  }
}

async function decrementGroups() {
  if (numAgeGroups.value > 1) {
    const viewTransition = startViewTransition()
    await viewTransition.captured
    numAgeGroups.value--
    // Clear manual adjustments when changing group count
    store.clearManualPartitions(categoryCode.value)
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

// Drag state
const isDragging = ref(false)
const draggingBoundaryIndex = ref(-1)

// Mobile sheet state
const showDancerSheet = ref(false)
const selectedAgeGroupIndex = ref<number | null>(null)
const dragPreviewY = ref<number | null>(null)
const showDragHandle = ref(false)
const dragHandlePositions = ref<Array<{ left: number; top: number; width: number }>>([])
const hoveredBoundaryIndex = ref(-1)
const isScrolling = ref(false)
let hideHandleTimeout: ReturnType<typeof setTimeout> | null = null
let scrollTimeout: ReturnType<typeof setTimeout> | null = null

// Function to select the input text when clicking the label
function selectGroupsInput() {
  if (groupsInputRef.value) {
    groupsInputRef.value.select()
  }
}

// Reset only manual partitions (keep current group count)
async function resetToDefaults() {
  const viewTransition = startViewTransition()
  await viewTransition.captured
  store.clearManualPartitions(categoryCode.value)
}

// Reset only the group count to default
async function resetGroupCount() {
  const viewTransition = startViewTransition()
  await viewTransition.captured
  numAgeGroups.value = getDefaultNumAgeGroups()
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

  // Check if this is the boundary being dragged and use preview Y if available
  let leftY
  if (rightSideIndex === draggingBoundaryIndex.value && dragPreviewY.value !== null) {
    leftY = dragPreviewY.value
  } else {
    // Position left line in the middle of gap between left cards (if next exists, otherwise bottom)
    leftY = nextLeftSide
      ? left.top -
        root.top +
        left.height +
        (nextLeftSide.getBoundingClientRect().top - left.top - left.height) / 2
      : left.top - root.top + left.height
  }

  // Position right line in the middle of the gap between current and next right card
  const rightY =
    right.top - root.top + right.height + (nextRight.top - right.top - right.height) / 2

  // Create path: straight line from left edge to end of left card, curve in middle, straight line to right edge
  return `M ${leftX} ${leftY} L ${leftCardEndX} ${leftY} C ${midX} ${leftY}, ${midX} ${rightY}, ${rightCardStartX} ${rightY} L ${rightX} ${rightY}`
}

// Boundary hover and drag handlers
function onBoundaryHover(boundaryIndex: number) {
  if (isDragging.value || isScrolling.value) return

  // Clear any pending hide timeout
  if (hideHandleTimeout) {
    clearTimeout(hideHandleTimeout)
    hideHandleTimeout = null
  }

  hoveredBoundaryIndex.value = boundaryIndex
  showDragHandle.value = true
}

function onBoundaryLeave() {
  if (isDragging.value) return

  // Start a delay before hiding the handle
  hideHandleTimeout = setTimeout(() => {
    if (!isDragging.value) {
      hoveredBoundaryIndex.value = -1
      showDragHandle.value = false
    }
    hideHandleTimeout = null
  }, 150)
}

function onDragHandleHover() {
  // Clear any pending hide timeout when hovering over handle
  if (hideHandleTimeout) {
    clearTimeout(hideHandleTimeout)
    hideHandleTimeout = null
  }

  // Keep the handle visible when hovering over it
  if (!isDragging.value) {
    showDragHandle.value = true
  }
}

function onDragHandleLeave() {
  if (isDragging.value) return

  // Start a delay before hiding the handle
  hideHandleTimeout = setTimeout(() => {
    if (!isDragging.value) {
      hoveredBoundaryIndex.value = -1
      showDragHandle.value = false
    }
    hideHandleTimeout = null
  }, 150)
}

function updateAllDragHandlePositions() {
  if (!colsRef.value || !leftSideRef.value || !rightSideRef.value) return

  const positions: Array<{ left: number; top: number; width: number }> = []
  const root = colsRef.value.getBoundingClientRect()

  // Calculate position for each boundary
  for (
    let boundaryIndex = 0;
    boundaryIndex < partitionedAgeCountsArray.value.length - 1;
    boundaryIndex++
  ) {
    const rightSide = rightSideRef.value[boundaryIndex]
    const maxAge = partitionedAgeCountsArray.value[boundaryIndex]?.[0]?.[1]
    const leftSideIndex = ageCountsArray.value.findIndex(([age]) => age === maxAge)
    const leftSide =
      leftSideRef.value[leftSideIndex === -1 ? leftSideRef.value.length - 1 : leftSideIndex]
    const nextLeftSide = leftSideRef.value[leftSideIndex + 1]

    if (!leftSide || !rightSide) continue

    const left = leftSide.getBoundingClientRect()

    // Calculate Y position - in the gap between left cards
    const leftY = nextLeftSide
      ? left.top -
        root.top +
        left.height +
        (nextLeftSide.getBoundingClientRect().top - left.top - left.height) / 2
      : left.top - root.top + left.height

    positions.push({
      left: left.left - root.left,
      top: leftY,
      width: left.width,
    })
  }

  dragHandlePositions.value = positions
}

// Scroll detection
function onScroll() {
  // Hide drag handle immediately when scrolling starts
  if (showDragHandle.value && !isDragging.value) {
    showDragHandle.value = false
    hoveredBoundaryIndex.value = -1
  }

  // Mark as scrolling
  isScrolling.value = true

  // Clear existing timeout
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  // Reset scrolling state after scroll ends
  scrollTimeout = setTimeout(() => {
    isScrolling.value = false
    scrollTimeout = null
  }, 150)
}

// Continuous drag handle position updates
function updateDragHandlePositionContinuously() {
  if (!isActive) {
    dragHandleRafId = requestAnimationFrame(updateDragHandlePositionContinuously)
    return
  }

  // Always update all positions (unless dragging or scrolling)
  if (!isDragging.value && !isScrolling.value) {
    updateAllDragHandlePositions()
  }

  dragHandleRafId = requestAnimationFrame(updateDragHandlePositionContinuously)
}

function onDragStart(event: MouseEvent | TouchEvent, boundaryIndex: number) {
  event.preventDefault()
  isDragging.value = true
  draggingBoundaryIndex.value = boundaryIndex
  showDragHandle.value = true

  // Detect if it's a touch or mouse event
  const isTouch = 'touches' in event
  const startY = isTouch ? event.touches[0].clientY : event.clientY
  const initialY = dragHandlePositions.value[boundaryIndex]?.top || 0

  // Track the last valid position
  let lastValidY = initialY
  let lastValidAge: number | null = null

  function onMove(moveEvent: MouseEvent | TouchEvent) {
    if (!isDragging.value) return

    const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY
    const deltaY = currentY - startY
    const newY = initialY + deltaY

    // Find the closest valid age boundary to snap to
    const snappedAge = calculateAgeFromY(newY)
    if (snappedAge !== null && isValidBoundaryChange(draggingBoundaryIndex.value, snappedAge)) {
      // Calculate the Y position for this age
      const snappedY = calculateYFromAge(snappedAge)
      if (snappedY !== null) {
        // Update last valid position
        lastValidY = snappedY
        lastValidAge = snappedAge

        dragPreviewY.value = snappedY
        // Update the specific handle position in the array
        if (dragHandlePositions.value[boundaryIndex]) {
          dragHandlePositions.value[boundaryIndex].top = snappedY
        }
      }
    } else {
      // Stay at last valid position instead of following mouse
      dragPreviewY.value = lastValidY
      if (dragHandlePositions.value[boundaryIndex]) {
        dragHandlePositions.value[boundaryIndex].top = lastValidY
      }
    }
  }

  async function onEnd() {
    if (!isDragging.value) return

    // Use the last valid age that was tracked during drag
    if (lastValidAge !== null && isValidBoundaryChange(draggingBoundaryIndex.value, lastValidAge)) {
      // Create new partition array
      const newPartitions = createNewPartitions(draggingBoundaryIndex.value, lastValidAge)
      if (newPartitions) {
        const viewTransition = startViewTransition()
        await viewTransition.captured
        store.setManualPartitions(categoryCode.value, newPartitions)
      }
    }

    // Reset drag state
    isDragging.value = false
    draggingBoundaryIndex.value = -1
    dragPreviewY.value = null
    showDragHandle.value = false
    hoveredBoundaryIndex.value = -1

    // Remove both mouse and touch listeners
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onEnd)
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
  }

  // Add both mouse and touch listeners
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onEnd)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd)
}

// Helper functions for partition calculations
function calculateAgeFromY(y: number): number | null {
  if (!leftSideRef.value || !colsRef.value) return null

  const root = colsRef.value.getBoundingClientRect()

  // Find closest age boundary
  let closestAge: number | null = null
  let closestDistance = Infinity

  leftSideRef.value.forEach((ageElement, ageIndex) => {
    const ageRect = ageElement.getBoundingClientRect()
    const ageY = ageRect.top - root.top + ageRect.height
    const distance = Math.abs(y - ageY)

    if (distance < closestDistance && distance < 30) {
      // Within 30px threshold
      closestDistance = distance
      const age = ageCountsArray.value[ageIndex]?.[0]
      if (age !== undefined) {
        closestAge = age
      }
    }
  })

  return closestAge
}

function calculateYFromAge(age: number): number | null {
  if (!leftSideRef.value || !colsRef.value) return null

  const root = colsRef.value.getBoundingClientRect()

  // Find the age element that matches this age
  const ageIndex = ageCountsArray.value.findIndex(([ageValue]) => ageValue === age)
  if (ageIndex === -1 || !leftSideRef.value[ageIndex]) return null

  const ageElement = leftSideRef.value[ageIndex]
  const nextAgeElement = leftSideRef.value[ageIndex + 1]

  const ageRect = ageElement.getBoundingClientRect()

  // Position at the bottom of this age element, or in the gap if there's a next element
  if (nextAgeElement) {
    const nextRect = nextAgeElement.getBoundingClientRect()
    return (
      ageRect.top - root.top + ageRect.height + (nextRect.top - ageRect.top - ageRect.height) / 2
    )
  } else {
    return ageRect.top - root.top + ageRect.height
  }
}

function isValidBoundaryChange(boundaryIndex: number, newAge: number): boolean {
  const currentPartitions = partitionedAgeCountsArray.value
  const ages = ageCountsArray.value.map(([age]) => age).sort((a, b) => a - b)

  // Check bounds - newAge must be within the available age range
  if (newAge < ages[0] || newAge >= ages[ages.length - 1]) return false

  // Get the boundaries of adjacent groups
  const prevGroupEnd = boundaryIndex > 0 ? currentPartitions[boundaryIndex - 1][0][1] : null
  const nextGroupStart =
    boundaryIndex < currentPartitions.length - 2 ? currentPartitions[boundaryIndex + 2][0][0] : null

  // Calculate what the group boundaries would be
  const currentGroupStart = prevGroupEnd !== null ? prevGroupEnd + 1 : ages[0]
  const nextGroupEnd = nextGroupStart !== null ? nextGroupStart - 1 : ages[ages.length - 1]

  // Ensure both groups would contain at least one actual age
  const currentGroupHasAges = ages.some((age) => age >= currentGroupStart && age <= newAge)
  const nextGroupHasAges = ages.some((age) => age > newAge && age <= nextGroupEnd)

  return currentGroupHasAges && nextGroupHasAges
}

function createNewPartitions(boundaryIndex: number, newAge: number): [number[], number][] | null {
  if (!isValidBoundaryChange(boundaryIndex, newAge)) return null

  const currentPartitions = partitionedAgeCountsArray.value
  const ages = ageCountsArray.value.map(([age]) => age).sort((a, b) => a - b)
  const newPartitions: [number[], number][] = []

  for (let i = 0; i < currentPartitions.length; i++) {
    const [currentRange, currentCount] = currentPartitions[i] // [ageRange, count]

    if (i === boundaryIndex) {
      // This group ends at the new age
      const startAge = i > 0 ? currentPartitions[i - 1][0][1] + 1 : ages[0]
      const newCount = ageCountsArray.value
        .filter(([age]) => age >= startAge && age <= newAge)
        .reduce((sum, [, count]) => sum + count, 0)
      newPartitions.push([[startAge, newAge], newCount])
    } else if (i === boundaryIndex + 1) {
      // This group starts after the new age
      const endAge = currentRange[1] // Keep the original end age of this group
      const newCount = ageCountsArray.value
        .filter(([age]) => age >= newAge + 1 && age <= endAge)
        .reduce((sum, [, count]) => sum + count, 0)
      newPartitions.push([[newAge + 1, endAge], newCount])
    } else if (i < boundaryIndex) {
      // Groups before the changed boundary keep their original boundaries
      newPartitions.push([currentRange, currentCount])
    } else {
      // Groups after the changed boundary (i > boundaryIndex + 1) keep their original boundaries
      newPartitions.push([currentRange, currentCount])
    }
  }

  return newPartitions
}

// Direct DOM manipulation - no Vue reactivity needed
let rafId: number | null = null
let dragHandleRafId: number | null = null
let isActive = false

function updateCurvesDirectly() {
  if (!isActive || !rightSideRef.value?.length || !svgRef.value) {
    rafId = requestAnimationFrame(updateCurvesDirectly)
    return
  }

  const svg = svgRef.value
  const curvesToRender = rightSideRef.value.slice(0, -1)

  // Ensure we have the right number of path elements (2 per curve: invisible hit area + visible line)
  const expectedChildCount = curvesToRender.length * 2
  while (svg.children.length < expectedChildCount) {
    const currentIndex = Math.floor(svg.children.length / 2)
    const isHitArea = svg.children.length % 2 === 0

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('data-boundary-index', currentIndex.toString())

    if (isHitArea) {
      // Invisible thick hit area
      path.setAttribute('class', 'fill-none stroke-transparent')
      path.setAttribute('stroke-width', '12')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('pointer-events', 'stroke')
      path.setAttribute('data-hit-area', 'true')

      // Add hover events only to hit area
      path.addEventListener('mouseenter', () => {
        const boundaryIndex = parseInt(path.getAttribute('data-boundary-index') || '0')
        onBoundaryHover(boundaryIndex)
      })
      path.addEventListener('mouseleave', onBoundaryLeave)
    } else {
      // Visible thin yellow line
      path.setAttribute('class', 'stroke-primary fill-none stroke-2')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('pointer-events', 'none')
      path.setAttribute('data-visible-line', 'true')
    }

    svg.appendChild(path)
  }

  // Remove extra path elements if needed
  while (svg.children.length > expectedChildCount) {
    svg.removeChild(svg.lastChild!)
  }

  // Update each path directly (both hit area and visible line)
  curvesToRender.forEach((el, index) => {
    const newPath = getCurvePath(el, index)

    // Update hit area path (even indices: 0, 2, 4...)
    const hitAreaElement = svg.children[index * 2] as SVGPathElement
    if (hitAreaElement.getAttribute('d') !== newPath) {
      hitAreaElement.setAttribute('d', newPath)
    }

    // Update visible line path (odd indices: 1, 3, 5...)
    const visibleLineElement = svg.children[index * 2 + 1] as SVGPathElement
    if (visibleLineElement.getAttribute('d') !== newPath) {
      visibleLineElement.setAttribute('d', newPath)
    }

    // Check if this boundary is manual (either dragged or due to non-standard group count)
    const isThisBoundaryManual = isBoundaryManual(index)

    // Update stroke color for this specific line (accent for manual, primary for default)
    const strokeClass = isThisBoundaryManual
      ? 'stroke-accent fill-none stroke-2'
      : 'stroke-primary fill-none stroke-2'
    if (visibleLineElement.getAttribute('class') !== strokeClass) {
      visibleLineElement.setAttribute('class', strokeClass)
    }
  })

  rafId = requestAnimationFrame(updateCurvesDirectly)
}

onMounted(async () => {
  // Start continuous RAF loops for direct DOM updates
  await nextTick() // Wait for SVG ref to be available
  isActive = true
  rafId = requestAnimationFrame(updateCurvesDirectly)
  dragHandleRafId = requestAnimationFrame(updateDragHandlePositionContinuously)

  // Add scroll listener to window
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => {
  isActive = false
  if (rafId) {
    cancelAnimationFrame(rafId)
  }
  if (dragHandleRafId) {
    cancelAnimationFrame(dragHandleRafId)
  }
  if (scrollTimeout) {
    clearTimeout(scrollTimeout)
  }

  // Remove scroll listener
  window.removeEventListener('scroll', onScroll)
})

// Age group interaction functions
async function openAgeGroupSheet(ageGroupIndex: number) {
  if (window.innerWidth >= 768) {
    // Desktop: Toggle dancers visibility with smooth scroll to element
    const viewTransition = startViewTransition()
    await viewTransition.captured
    showDancers.value = !showDancers.value

    const ageGroupElement = rightSideRef.value?.[ageGroupIndex]

    // Wait for transition to complete, then smooth scroll to the tapped element
    await viewTransition.finished

    // Find and scroll to the tapped age group element
    if (ageGroupElement) {
      await nextTick()
      ageGroupElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  } else {
    // Mobile: Open sheet
    selectedAgeGroupIndex.value = ageGroupIndex
    showDancerSheet.value = true
  }
}

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
