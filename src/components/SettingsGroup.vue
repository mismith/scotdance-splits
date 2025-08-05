<template>
  <AccordionItem :value="title">
    <AccordionTrigger class="py-3 hover:no-underline">
      <div class="flex items-center gap-2">
        <component
          v-if="icon"
          :is="icon"
          class="h-4 w-4 shrink-0"
          :class="{
            'text-destructive': isValid === false,
            'text-muted-foreground': isValid !== false,
          }"
        />
        <span class="font-medium">{{ title }}</span>
        <AlertCircle v-if="isValid === false" class="h-4 w-4 text-destructive ml-auto mr-2" />
      </div>
    </AccordionTrigger>
    <AccordionContent>
      <div v-if="description" class="text-sm text-muted-foreground mb-3">
        {{ description }}
      </div>
      <slot />
    </AccordionContent>
  </AccordionItem>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { AlertCircle } from 'lucide-vue-next'
import type { Component } from 'vue'

interface Props {
  title: string
  description?: string
  icon?: Component
  isValid?: boolean
}

const props = defineProps<Props>()

const isValid = computed(() => props.isValid)
</script>
