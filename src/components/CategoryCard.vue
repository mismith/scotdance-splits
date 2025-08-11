<template>
  <Card class="category-card">
    <CardHeader class="flex flex-wrap items-center justify-between space-y-0 pb-4">
      <div class="flex items-center space-x-3">
        <CardTitle class="text-xl font-bold">{{ name }}</CardTitle>
        <DancerCount :count="totalDancers" />
      </div>
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-muted-foreground">Split into:</span>
        <Input
          type="number"
          v-model.number="numAgeGroups"
          :min="1"
          :max="ageCountsArray.length"
          class="w-20 text-center"
          @blur="!numAgeGroups && (numAgeGroups = getDefaultNumAgeGroups())"
          @keyup.enter="($event.target as HTMLInputElement).blur()"
        />
        <span class="text-sm text-muted-foreground">groups</span>
      </div>
    </CardHeader>
    <CardContent>
      <div class="relative">
        <div ref="colsRef" class="flex gap-4">
          <!-- Left side: Individual ages -->
          <div class="flex flex-col flex-3 lg:flex-1">
            <div class="text-sm font-medium text-muted-foreground mb-2">Individual Ages</div>
            <div class="flex flex-col flex-1 gap-2">
              <div
                v-for="[age, count] in ageCountsArray"
                :key="age"
                ref="leftSideRef"
                class="flex items-center justify-between p-3 text-sm bg-secondary/50 border border-border rounded-md hover:bg-secondary/70 transition-colors min-h-[48px]"
              >
                <span class="font-medium">Age {{ age }}</span>
                <DancerCount :count="count" :total="totalDancers" size="x-small" />
              </div>
            </div>
          </div>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- Right side: Partitioned groups -->
          <div class="flex flex-col flex-3 lg:flex-1">
            <div class="text-sm font-medium text-muted-foreground mb-2">Age Groups</div>
            <div class="flex flex-col flex-1 gap-2">
              <div
                v-for="([[minAge, maxAge], count], index) in partitionedAgeCountsArray"
                :key="index"
                ref="rightSideRef"
                :style="{ flex: `${count} 1 0` }"
                class="flex items-center justify-between p-3 text-sm bg-secondary/50 border border-border rounded-md hover:bg-secondary/70 transition-colors min-h-[48px]"
              >
                <span class="font-semibold text-foreground">{{
                  getAgeGroupName(minAge, maxAge, isPrintingYears)
                }}</span>
                <DancerCount :count="count" :total="totalDancers" size="x-small" />
              </div>
            </div>
          </div>

          <!-- Third column: Preview Dancers -->
          <div v-if="showPreviewDancers" class="flex flex-col flex-3 lg:flex-1 ml-4">
            <div class="text-sm font-medium text-muted-foreground mb-2">Preview Dancers</div>
            <div class="flex flex-col flex-1 gap-2">
              <div
                v-for="([, count], index) in partitionedAgeCountsArray"
                :key="`preview-${index}`"
                :style="{ minHeight: `${Math.max(48, Math.min(count, 8) * 20 + 24)}px` }"
                class="p-3 text-sm bg-muted/30 border border-border/50 rounded-md flex flex-col justify-center"
              >
                <div class="space-y-1">
                  <div 
                    v-for="dancer in getMockDancersForAgeGroup(count, Math.min(count, 8))"
                    :key="dancer.bibNumber"
                    class="flex items-center gap-2 text-xs text-muted-foreground"
                  >
                    <span class="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold min-w-[2rem] text-center">
                      {{ dancer.bibNumber }}
                    </span>
                    <span class="truncate">{{ dancer.firstName }} {{ dancer.lastName }}</span>
                  </div>
                  <div v-if="count > 8" class="text-[10px] text-muted-foreground/70 text-center pt-1">
                    +{{ count - 8 }} more
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SVG connections -->
        <svg
          v-if="rightSideRef?.length > 1"
          class="absolute inset-0 w-full h-full pointer-events-none"
          style="overflow: visible"
        >
          <path
            v-for="(el, index) in rightSideRef.slice(0, rightSideRef.length - 1)"
            :key="`${index}-${changeTracker}`"
            :d="getCurvePath(el, index)"
            class="stroke-primary fill-none stroke-2"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { ref, computed, watch, inject, onMounted, onUnmounted, nextTick } from 'vue'
import partition from 'linear-partitioning'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import DancerCount from '@/components/DancerCount.vue'
import { getAgeGroupName } from '@/lib/helpers'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  ages: {
    type: Object,
    required: true,
  },
})

const isPrintingYears = inject<boolean>('isPrintingYears')
const showPreviewDancers = inject('showPreviewDancers', ref(false))

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

// Mock dancers function for preview
function getMockDancersForAgeGroup(_totalCount: number, displayCount: number) {
  const mockNames = ['Emma', 'James', 'Isla', 'Connor', 'Sophie', 'Hamish', 'Fiona', 'Liam', 'Morag', 'Duncan']
  const mockSurnames = ['MacDonald', 'Campbell', 'Fraser', 'McLeod', 'Stewart', 'Murray', 'Sinclair', 'Robertson', 'MacLeod', 'Morrison']
  
  return Array.from({ length: Math.min(displayCount, 15) }, (_, i) => ({
    firstName: mockNames[i % mockNames.length],
    lastName: mockSurnames[i % mockSurnames.length],
    bibNumber: 100 + i
  }))
}

const colsRef = ref()
const leftSideRef = ref<HTMLElement[]>([])
const rightSideRef = ref<HTMLElement[]>([])
const changeTracker = ref(false)

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


async function refresh() {
  await nextTick()
  changeTracker.value = !changeTracker.value
}

defineExpose({ refresh })

const resizeObserver = new ResizeObserver(() => refresh())
onMounted(async () => {
  if (colsRef.value) {
    resizeObserver.observe(colsRef.value)
  }
  // Initial refresh to draw curves after mount
  await nextTick()
  refresh()
})
onUnmounted(() => {
  resizeObserver.disconnect()
})

const emit = defineEmits(['partition'])

watch(
  partitionedAgeCountsArray,
  (partitions) => {
    emit(
      'partition',
      partitions.map(([ageRange]) => ageRange),
    )
    // Refresh curves after partition changes
    setTimeout(() => refresh(), 50)
  },
  { immediate: true },
)

// Watch for changes in refs to trigger curve updates
watch(
  [leftSideRef, rightSideRef],
  () => {
    setTimeout(() => refresh(), 10)
  },
  { deep: true },
)
</script>
