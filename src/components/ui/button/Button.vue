<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { type ButtonVariants, buttonVariants } from '.'
import { type ButtonAction, useButtonAction } from '@/lib/buttonAction'
import { cn } from '@/lib/utils'

interface Props extends PrimitiveProps {
  busy?: boolean
  disabled?: boolean
  onClick?: ButtonAction | ButtonAction[]
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
})
const action = useButtonAction(props)
</script>

<template>
  <Primitive
    data-slot="button"
    :disabled="action.disabled.value"
    :aria-busy="action.busy.value || undefined"
    @click="action.click"
    :as="as"
    :as-child="asChild"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <LoaderCircle
      v-if="action.busy.value && !asChild"
      class="size-4 animate-spin motion-reduce:animate-none"
      aria-hidden="true"
    />
    <slot />
  </Primitive>
</template>
