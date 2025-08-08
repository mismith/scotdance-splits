<template>
  <AccordionItem :value="title">
    <AccordionTrigger>
      <div class="flex items-center w-full gap-2">
        <span class="font-medium mr-auto">{{ title }}</span>
        <TooltipProvider v-if="isValid">
          <Tooltip>
            <TooltipTrigger>
              <CheckIcon class="size-5 text-green-500" />
            </TooltipTrigger>
            <TooltipContent>
              <p>All fields in this section are valid</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider v-else>
          <Tooltip>
            <TooltipTrigger>
              <XIcon class="size-5 text-destructive" />
            </TooltipTrigger>
            <TooltipContent>
              <p>This section has validation issues that need to be fixed</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CheckIcon, XIcon } from 'lucide-vue-next'
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
