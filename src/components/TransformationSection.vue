<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { ArrowDown, ArrowRight } from 'lucide-vue-next'
import { ref } from 'vue'

const sectionRef = ref<HTMLElement>()
const isVisible = ref(false)

useIntersectionObserver(
  sectionRef,
  ([entry]) => {
    if (entry?.isIntersecting) {
      isVisible.value = true
    }
  },
  { threshold: 0.1 },
)

// Generate dates spread over the last ~80 days, ascending
const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return formatDate(d)
}

const beforeData = [
  { name: 'Isla Morrison', category: 'Beginner', age: 7, date: daysAgo(72) },
  { name: 'Angus Clark', category: 'Premier', age: 17, date: daysAgo(64) },
  { name: 'Grace Brown', category: 'Beginner', age: 8, date: daysAgo(55) },
  { name: 'Freya Scott', category: 'Premier', age: 15, date: daysAgo(48) },
  { name: 'Sophie King', category: 'Beginner', age: 10, date: daysAgo(40) },
  { name: 'Ruby Walker', category: 'Premier', age: 21, date: daysAgo(33) },
  { name: 'Olivia Hill', category: 'Beginner', age: 9, date: daysAgo(27) },
  { name: 'Isabella Clark', category: 'Beginner', age: 10, date: daysAgo(21) },
  { name: 'Hannah Scott', category: 'Beginner', age: 11, date: daysAgo(15) },
  { name: 'Megan Grant', category: 'Premier', age: 15, date: daysAgo(10) },
  { name: 'Lily Wright', category: 'Beginner', age: 9, date: daysAgo(5) },
  { name: 'Hannah Martin', category: 'Beginner', age: 11, date: daysAgo(1) },
]

// Bibs assigned by registration order: row 1 (oldest) = 112, row 12 (newest) = 101
// Listed ascending within each group on the right
const afterGroups = [
  {
    label: 'Beginner 7 & Under 9 Years',
    dancers: [
      { bib: 102, name: 'Lily Wright' },
      { bib: 106, name: 'Olivia Hill' },
      { bib: 110, name: 'Grace Brown' },
      { bib: 112, name: 'Isla Morrison' },
    ],
  },
  {
    label: 'Beginner 10 & 11 Years',
    dancers: [
      { bib: 101, name: 'Hannah Martin' },
      { bib: 104, name: 'Hannah Scott' },
      { bib: 105, name: 'Isabella Clark' },
      { bib: 108, name: 'Sophie King' },
    ],
  },
  {
    label: 'Premier 15 Years & Over',
    dancers: [
      { bib: 103, name: 'Megan Grant' },
      { bib: 107, name: 'Ruby Walker' },
      { bib: 109, name: 'Freya Scott' },
      { bib: 111, name: 'Angus Clark' },
    ],
  },
]
</script>

<template>
  <section ref="sectionRef" class="px-6 py-24 md:py-32">
    <div class="max-w-2xl mx-auto text-center mb-12 md:mb-16">
      <h2 class="text-2xl md:text-3xl font-bold tracking-tight mb-3">See the difference</h2>
      <p class="text-muted-foreground text-sm md:text-base">
        Raw registration data becomes competition-ready groups in seconds.
      </p>
    </div>

    <div
      class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-6 md:gap-8 items-start"
    >
      <!-- Before -->
      <div
        class="transition-all duration-700 ease-out motion-reduce:transition-none pointer-events-none"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        <p class="text-xs text-muted-foreground/60 mb-2 text-center">Before</p>
        <div class="rounded-2xl border border-border/80 bg-muted/30 shadow-lg overflow-hidden">
          <table class="w-full text-[13px]">
            <thead>
              <tr class="bg-muted/50">
                <th class="text-left py-2.5 px-4 font-medium text-muted-foreground/80 text-xs">
                  Name
                </th>
                <th class="text-left py-2.5 px-4 font-medium text-muted-foreground/80 text-xs">
                  Category
                </th>
                <th class="text-left py-2.5 px-4 font-medium text-muted-foreground/80 text-xs">
                  Age
                </th>
                <th class="text-left py-2.5 px-4 font-medium text-muted-foreground/80 text-xs">
                  Registered
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in beforeData" :key="i" class="border-t border-border/40">
                <td class="py-2 px-4 whitespace-nowrap">{{ row.name }}</td>
                <td class="py-2 px-4 text-muted-foreground">{{ row.category }}</td>
                <td class="py-2 px-4 text-muted-foreground">{{ row.age }}</td>
                <td class="py-2 px-4 text-muted-foreground/60 text-xs whitespace-nowrap">
                  {{ row.date }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Arrow connector -->
      <div class="flex items-center justify-center md:self-center md:mt-6">
        <div class="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <ArrowDown class="w-5 h-5 text-primary/50 md:hidden" />
          <ArrowRight class="w-5 h-5 text-primary/50 hidden md:block" />
        </div>
      </div>

      <!-- After -->
      <div
        class="transition-all duration-700 ease-out delay-150 motion-reduce:transition-none pointer-events-none"
        :class="isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'"
      >
        <p class="text-xs text-primary/60 mb-2 text-center">After</p>
        <div
          class="rounded-2xl border-2 border-primary/20 bg-primary/[0.03] shadow-lg overflow-hidden"
        >
          <div class="p-5 md:p-6 space-y-5">
            <div v-for="(group, i) in afterGroups" :key="i">
              <div
                class="text-xs font-medium text-primary/70 mb-2 pb-1.5 border-b border-primary/10"
              >
                {{ group.label }}
              </div>
              <div class="space-y-1">
                <div
                  v-for="dancer in group.dancers"
                  :key="dancer.bib"
                  class="flex items-center gap-3 text-[13px] py-1 px-1"
                >
                  <span class="font-mono text-primary/50 w-7 text-right text-xs tabular-nums">{{
                    dancer.bib
                  }}</span>
                  <span>{{ dancer.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
