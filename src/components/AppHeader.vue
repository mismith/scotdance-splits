<template>
  <div class="bg-primary text-primary-foreground shadow-sm">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <img src="/touchicon.png" alt="Splits Logo" class="w-8 h-8" />
          <h1 class="text-2xl font-bold text-primary-foreground">Splits</h1>
        </div>

        <Button
          variant="ghost"
          size="sm"
          @click="toggleDarkMode"
          class="w-9 h-9 p-0 hover:bg-primary-foreground/10"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>
      </div>

      <!-- Optional slot for additional content like stepper -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/composables/useDarkMode'
import { Sun, Moon } from 'lucide-vue-next'

// Dark mode
const { isDark, toggle } = useDarkMode()
function toggleDarkMode() {
  toggle()
}
</script>
