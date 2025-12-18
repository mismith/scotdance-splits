<script setup lang="ts">
import BackgroundTexture from '@/assets/bg/txture.png?url'
import { TooltipProvider } from '@/components/ui/tooltip'
</script>

<template>
  <TooltipProvider>
    <RouterView :style="{ backgroundImage: `url(${BackgroundTexture})` }" />
  </TooltipProvider>
</template>
