<template>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="sm"
        v-view-transition-name="'DarkModeToggle'"
        @click="toggleDarkMode"
        class="w-9 h-9 p-0"
      >
        <Sun v-if="isDark" class="h-4 w-4" />
        <Moon v-else class="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      <p>{{ isDark ? 'Disable Dark Mode' : 'Enable Dark Mode' }}</p>
    </TooltipContent>
  </Tooltip>
</template>

<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { startViewTransition } from 'vue-view-transitions'
import { useDarkMode } from '@/composables/useDarkMode'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const { isDark, toggle } = useDarkMode()
async function toggleDarkMode() {
  const viewTransition = startViewTransition()
  await viewTransition.captured
  toggle()
}
</script>
