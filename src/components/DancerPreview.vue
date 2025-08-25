<template>
  <div class="space-y-1">
    <div
      v-for="dancer in dancers"
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
</template>

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