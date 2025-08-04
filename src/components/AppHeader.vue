<template>
  <div class="bg-primary text-primary-foreground shadow-sm">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" @click="$emit('home-click')">
          <img src="/touchicon.png" alt="Splits Logo" class="w-8 h-8" />
          <h1 class="text-2xl font-bold text-primary-foreground">Splits</h1>
        </div>

        <!-- Compact stepper in header when provided -->
        <div v-if="showStepper" class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div
              v-for="stepNum in [1, 2, 3]"
              :key="stepNum"
              @click="stepNum <= maxStep && $emit('step-change', stepNum)"
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors',
                step === stepNum
                  ? 'bg-primary-foreground/20 text-primary-foreground font-medium'
                  : stepNum <= maxStep
                    ? 'text-primary-foreground/70 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                    : 'text-primary-foreground/40 cursor-not-allowed',
              ]"
            >
              <div
                :class="[
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  step === stepNum
                    ? 'bg-primary-foreground text-primary'
                    : stepNum <= maxStep
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-primary-foreground/10 text-primary-foreground/40',
                ]"
              >
                {{ stepNum }}
              </div>
              <span class="hidden sm:inline">
                {{ stepNum === 1 ? 'Input' : stepNum === 2 ? 'Group' : 'Export' }}
              </span>
            </div>
          </div>
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

      <!-- Optional slot for additional content -->
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { useDarkMode } from '@/composables/useDarkMode'
import { Sun, Moon } from 'lucide-vue-next'

interface Props {
  showStepper?: boolean
  step?: number
  maxStep?: number
}

defineProps<Props>()

defineEmits<{
  'step-change': [step: number]
  'home-click': []
}>()

// Dark mode
const { isDark, toggle } = useDarkMode()
function toggleDarkMode() {
  toggle()
}
</script>
