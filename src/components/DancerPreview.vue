<script setup lang="ts">
export interface DancerData {
  bibNumber: number
  firstName: string
  lastName: string
  location: string
}

defineProps<{
  dancers: DancerData[]
}>()
</script>

<template>
  <ul class="space-y-1 list-none p-0 m-0">
    <li v-for="(dancer, i) in dancers" :key="i" class="flex items-center gap-2 text-xs">
      <span class="truncate text-foreground flex-1"
        >{{ dancer.firstName }} {{ dancer.lastName }}</span
      >
      <span class="truncate text-muted-foreground text-[10px]">{{ dancer.location }}</span>
    </li>
  </ul>
</template>
