<script setup lang="ts">
import { Transition, TransitionGroup, computed } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  group?: boolean
  orientation?: 'vertical' | 'horizontal'
  tag?: string
  class?: any
}

const props = withDefaults(defineProps<Props>(), {
  group: false,
  orientation: 'vertical',
  tag: undefined,
  class: undefined,
})

const isHorizontal = computed(() => props.orientation === 'horizontal')

async function handleBeforeTransition(el: Element) {
  requestAnimationFrame(() => {
    const htmlEl = el as HTMLElement
    if (isHorizontal.value) {
      htmlEl.style.setProperty('--transition-expand-width', `${htmlEl.scrollWidth}px`)
    } else {
      htmlEl.style.setProperty('--transition-expand-height', `${htmlEl.scrollHeight}px`)
    }
  })
}
</script>

<template>
  <component
    :is="group ? TransitionGroup : Transition"
    v-bind="{ class: group && tag ? props.class : undefined }"
    :enter-active-class="cn('transition-all overflow-hidden', props.class)"
    :enter-from-class="cn(isHorizontal ? 'max-w-0' : 'max-h-0')"
    :enter-to-class="
      cn(isHorizontal ? 'max-w-[--transition-expand-width]' : 'max-h-[--transition-expand-height]')
    "
    :leave-active-class="cn('transition-all overflow-hidden', props.class)"
    :leave-from-class="
      cn(isHorizontal ? 'max-w-[--transition-expand-width]' : 'max-h-[--transition-expand-height]')
    "
    :leave-to-class="cn(isHorizontal ? 'max-w-0' : 'max-h-0')"
    @before-enter="handleBeforeTransition"
    @before-leave="handleBeforeTransition"
  >
    <slot />
  </component>
</template>
