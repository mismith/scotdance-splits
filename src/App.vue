<script setup lang="ts">
import { TooltipProvider } from '@/components/ui/tooltip'
</script>

<template>
  <TooltipProvider>
    <RouterView />
  </TooltipProvider>
</template>
