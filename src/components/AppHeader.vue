<template>
  <div class="border-b bg-card shadow-sm">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-foreground">Splits</h1>
          <span class="text-muted-foreground">Highland Dance Competition Organizer</span>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          @click="toggleDarkMode"
          class="w-9 h-9 p-0"
          :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          <span v-if="isDark" class="text-lg">☀️</span>
          <span v-else class="text-lg">🌙</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
import { useDarkMode } from '@/composables/useDarkMode';

const { isDark, toggle: toggleDarkMode } = useDarkMode();
</script>