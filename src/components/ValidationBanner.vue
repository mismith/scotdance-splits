<template>
  <div
    v-if="props.issues.length > 0 && !isDismissed"
    class="pointer-events-auto max-w-lg mx-auto mb-4 relative overflow-hidden backdrop-blur-lg rounded-4xl shadow-xl border transition-all duration-300"
    :class="bannerColorClass"
  >
    <!-- Close button -->
    <Button
      variant="ghost"
      size="sm"
      @click="handleDismiss"
      class="absolute top-4 right-4 w-8 h-8 p-0 z-10 rounded-full transition-colors"
      :class="closeButtonClass"
    >
      <X class="h-4 w-4" :class="textColorClass" />
    </Button>

    <!-- Main content -->
    <div class="p-6 pr-16">
      <div class="flex items-start gap-4">
        <!-- Icon -->
        <div
          class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
          :class="iconBgClass"
        >
          <AlertTriangle class="w-5 h-5" :class="iconColorClass" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h3 class="text-base font-semibold mb-1" :class="headingColorClass">
            {{ issueCount }} data issue{{ issueCount > 1 ? 's' : '' }}
          </h3>

          <!-- Show all issue messages -->
          <div class="space-y-2 mb-4">
            <p
              v-for="(issue, index) in props.issues"
              :key="index"
              class="text-sm"
              :class="textColorClass"
            >
              {{ issue.message }}
            </p>
          </div>

          <!-- Action buttons -->
          <div class="flex gap-2">
            <Button size="sm" @click="$emit('review')" :class="actionButtonClass">Review</Button>
            <Button size="sm" variant="ghost" @click="handleDismiss" :class="dismissButtonClass">
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import type { ValidationIssue } from '@/lib/input'

interface Props {
  issues: ValidationIssue[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  review: []
  dismiss: []
}>()

const isDismissed = ref(false)

const issueCount = computed(() => props.issues.length)

// Check if any issue is an error (for styling)
const hasError = computed(() => props.issues.some((issue) => issue.severity === 'error'))

// Styling based on severity
const bannerColorClass = computed(() => {
  if (hasError.value) {
    return 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/50 dark:to-red-900/50 border-red-200 dark:border-red-800'
  }
  return 'bg-gradient-to-r from-primary/10 to-primary/20 dark:from-primary/20 dark:to-primary/30 border-primary/30 dark:border-primary/50'
})

const iconBgClass = computed(() => {
  if (hasError.value) {
    return 'bg-red-100 dark:bg-red-900/50'
  }
  return 'bg-primary/20 dark:bg-primary/30'
})

const iconColorClass = computed(() => {
  if (hasError.value) {
    return 'text-red-600 dark:text-red-400'
  }
  return 'text-primary'
})

const headingColorClass = computed(() => {
  if (hasError.value) {
    return 'text-red-900 dark:text-red-100'
  }
  return 'text-primary dark:text-primary'
})

const textColorClass = computed(() => {
  if (hasError.value) {
    return 'text-red-700 dark:text-red-300'
  }
  return 'text-primary/80 dark:text-primary/90'
})

const closeButtonClass = computed(() => {
  if (hasError.value) {
    return 'hover:bg-red-100 dark:hover:bg-red-900/50'
  }
  return 'hover:bg-primary/10 dark:hover:bg-primary/20'
})

const actionButtonClass = computed(() => {
  if (hasError.value) {
    return 'bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm'
  }
  return 'bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm'
})

const dismissButtonClass = computed(() => {
  if (hasError.value) {
    return 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50'
  }
  return 'text-primary hover:bg-primary/10 dark:text-primary dark:hover:bg-primary/20'
})

function handleDismiss() {
  isDismissed.value = true
  emit('dismiss')
}
</script>
