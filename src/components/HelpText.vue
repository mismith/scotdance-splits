<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>

<template>
  <div class="flex items-start text-xs gap-2 p-2 bg-muted text-muted-foreground rounded-md">
    <Info class="h-3 w-3 shrink-0 mt-0.5" />
    <div class="text-xs text-muted-foreground">
      <slot />
    </div>
  </div>
</template>
