<template>
  <TooltipProvider v-if="total">
    <Tooltip>
      <TooltipTrigger as-child>
        <span 
          :class="cn(
            'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors cursor-help',
            'bg-secondary text-secondary-foreground',
            sizeClasses[size]
          )"
        >
          {{ count }}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{{ count }} / {{ total }} ({{ Math.round((count / total) * 100) }}%)</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
  <span 
    v-else
    :class="cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors',
      'bg-secondary text-secondary-foreground',
      sizeClasses[size]
    )"
  >
    {{ count }}
  </span>
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Props {
  count: number;
  total?: number;
  size?: 'small' | 'default' | 'x-small';
}

withDefaults(defineProps<Props>(), {
  size: 'default',
});

const sizeClasses = {
  'x-small': 'text-xs px-1.5 py-0.5',
  'small': 'text-sm px-2 py-0.5', 
  'default': 'text-sm px-2.5 py-0.5',
};
</script>