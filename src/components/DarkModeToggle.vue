<template>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="sm" @click="toggleDarkMode" class="w-9 h-9 p-0">
          <Sun v-if="isDark" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ isDark ? 'Disable Dark Mode' : 'Enable Dark Mode' }}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDarkMode } from '@/composables/useDarkMode'
import { Sun, Moon } from 'lucide-vue-next'

const { isDark, toggle } = useDarkMode()
function toggleDarkMode() {
  toggle()
}
</script>