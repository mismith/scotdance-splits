<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { ChevronRight } from 'lucide-vue-next'
import type { AccordionTriggerProps } from 'reka-ui'
import { AccordionHeader, AccordionTrigger } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps<AccordionTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AccordionHeader class="flex">
    <AccordionTrigger
      data-slot="accordion-trigger"
      v-bind="delegatedProps"
      :class="
        cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 -mx-2 px-2 flex flex-1 items-start hover:bg-muted justify-between gap-2 rounded-md py-2 text-left text-sm font-medium transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-90',
          props.class,
        )
      "
    >
      <slot name="icon">
        <ChevronRight
          class="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200"
        />
      </slot>
      <slot />
    </AccordionTrigger>
  </AccordionHeader>
</template>
