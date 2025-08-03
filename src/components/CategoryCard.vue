<template>
  <Card class="w-full">
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <div class="flex items-center space-x-2">
        <CardTitle>{{ name }}</CardTitle>
        <DancerCount :count="totalDancers" />
      </div>
      <div class="flex items-center space-x-2">
        <span class="text-sm text-muted-foreground">Split into:</span>
        <Input
          type="number"
          v-model.number="numAgeGroups"
          :min="1"
          :max="ageCountsArray.length"
          class="w-20"
          @blur="!numAgeGroups && (numAgeGroups = getDefaultNumAgeGroups())"
          @keyup.enter="($event.target as HTMLInputElement).blur()"
        />
      </div>
    </CardHeader>
    <CardContent>
      <div class="cols-container">
        <div ref="colsRef" class="cols">
          <!-- Left side: Individual ages -->
          <div class="space-y-1">
            <div
              v-for="[age, count] in ageCountsArray"
              :key="age"
              ref="leftSideRef"
              class="flex items-center justify-between p-2 text-sm bg-muted/30 rounded"
            >
              <span>Age {{ age }}</span>
              <DancerCount :count="count" :total="totalDancers" size="x-small" />
            </div>
          </div>
          
          <!-- Spacer -->
          <div class="w-8"></div>
          
          <!-- Right side: Partitioned groups -->
          <div class="space-y-1">
            <div
              v-for="([[minAge, maxAge], count], index) in partitionedAgeCountsArray"
              :key="index"
              ref="rightSideRef"
              :style="{ height: `${Math.max(20, (count / totalDancers) * 200)}px` }"
              class="flex items-center justify-between p-2 text-sm bg-primary/10 border border-primary/20 rounded"
            >
              <span class="font-medium">{{ getAgeGroupName(minAge, maxAge, isPrintingYears) }}</span>
              <DancerCount :count="count" :total="totalDancers" size="x-small" />
            </div>
          </div>
        </div>
        
        <!-- SVG connections -->
        <svg v-if="rightSideRef?.length > 1" class="absolute inset-0 w-full h-full pointer-events-none">
          <path
            v-for="(el, index) in rightSideRef.slice(0, rightSideRef.length - 1)"
            :key="index"
            :d="getCurvePath(el, index)"
            class="stroke-muted-foreground/25 fill-none stroke-1"
          />
        </svg>
      </div>
    </CardContent>
  </Card>
</template>

<script lang="ts" setup>
import { ref, computed, watch, inject, onMounted, onUnmounted } from 'vue'
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

const colsRef = ref()
const leftSideRef = ref<HTMLElement[]>([])
const rightSideRef = ref<HTMLElement[]>([])
const changeTracker = ref(false)

function getCurvePath(rightSide: HTMLElement, rightSideIndex: number) {
  const maxAge = partitionedAgeCountsArray.value[rightSideIndex]?.[0]?.[1]
  const leftSideIndex = ageCountsArray.value.findIndex(([age]) => age === maxAge)
  const leftSide = leftSideRef.value[leftSideIndex === -1 ? leftSideRef.value.length - 1 : leftSideIndex]
  
  if (!colsRef.value || !leftSide || !rightSide) return ''
  
  const root = colsRef.value.getBoundingClientRect()
  const left = leftSide.getBoundingClientRect()
  const right = rightSide.getBoundingClientRect()
  
  return `
    M ${left.left - root.left} ${left.top - root.top + left.height}
    L ${left.left - root.left + left.width} ${left.top - root.top + left.height}
    C ${root.left + root.width / 2} ${left.top - root.top + left.height},
      ${root.left + root.width / 2} ${right.top - root.top + right.height},
      ${right.left - root.left} ${right.top - root.top + right.height}
    L ${right.left - root.left + right.width} ${right.top - root.top + right.height}`
}

function refresh() {
  changeTracker.value = !changeTracker.value
}

defineExpose({ refresh })

const resizeObserver = new ResizeObserver(() => refresh())
onMounted(() => {
  if (colsRef.value) {
    resizeObserver.observe(colsRef.value)
  }
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
  },
  { immediate: true },
)
</script>

<style scoped>
.cols-container {
  position: relative;
}

.cols {
  display: flex;
  gap: 1rem;
}

.cols > div:first-child,
.cols > div:last-child {
  flex: 1;
}
</style>