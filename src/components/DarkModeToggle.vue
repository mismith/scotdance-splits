<template>
  <Button variant="ghost" size="sm" @click="toggleDarkMode" class="w-9 h-9 p-0">
    <Sun v-if="isDark" class="h-4 w-4" />
    <Moon v-else class="h-4 w-4" />
  </Button>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/composables/useDarkMode'
import { Sun, Moon } from 'lucide-vue-next'

const { isDark, toggle } = useDarkMode()
function toggleDarkMode() {
  toggle()
}
</script>