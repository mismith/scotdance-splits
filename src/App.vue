<script setup lang="ts">
import { ref, watch } from 'vue'
import { startViewTransition } from 'vue-view-transitions'
import { useAppStore } from '@/stores/app'
import { TooltipProvider } from '@/components/ui/tooltip'
import HomeView from '@/views/HomeView.vue'
import SplitsView from '@/views/SplitsView.vue'

const store = useAppStore()

const hasData = ref(store.hasData)
watch(
  () => store.hasData,
  async (newValue) => {
    const viewTransition = startViewTransition()
    await viewTransition.captured
    hasData.value = newValue
  },
  { immediate: true },
)
</script>

<template>
  <TooltipProvider>
    <HomeView v-if="!hasData" />
    <SplitsView v-else />
  </TooltipProvider>
</template>
