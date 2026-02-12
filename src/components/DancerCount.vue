<script setup lang="ts">
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn, pluralize } from '@/lib/utils'

interface Props {
  count: number
  total?: number
  size?: 'small' | 'default' | 'x-small'
}

withDefaults(defineProps<Props>(), {
  size: 'default',
})

const sizeClasses = {
  'x-small': 'text-xs px-1.5 py-0.5',
  small: 'text-sm px-2 py-0.5',
  default: 'text-sm px-2.5 py-0.5',
}
</script>

<template>
  <!-- Mobile: Simple text on new line -->
  <div>
    <div class="md:hidden text-xs text-muted-foreground mt-1">
      {{ count }} {{ pluralize(count, 'dancer') }}
    </div>

    <!-- Desktop: Badge with tooltip -->
    <span class="hidden md:inline-flex">
      <Tooltip>
        <TooltipTrigger as-child>
          <span
            :class="
              cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors',
                'bg-secondary text-secondary-foreground',
                sizeClasses[size],
              )
            "
          >
            {{ count }}
          </span>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p v-if="total">
            {{ count }} out of {{ total }} {{ pluralize(total, 'dancer') }} ({{
              Math.round((count / total) * 100)
            }}%)
          </p>
          <p v-else>{{ count }} {{ pluralize(count, 'dancer') }} total</p>
        </TooltipContent>
      </Tooltip>
    </span>
  </div>
</template>
