<script setup lang="ts">
import EntriesImport from '@/components/EntriesImport.vue'
import { TooltipProvider } from '@/components/ui/tooltip'
</script>

<template>
  <TooltipProvider>
    <RouterView />
    <EntriesImport />
  </TooltipProvider>
</template>
