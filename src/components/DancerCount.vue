<template>
  <span 
    :class="cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold transition-colors',
      'bg-secondary text-secondary-foreground',
      sizeClasses[size]
    )"
  >
    {{ count }}{{ total ? ` / ${total}` : '' }}
    <span v-if="total" class="ml-1 text-xs opacity-70">
      ({{ Math.round((count / total) * 100) }}%)
    </span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { cn } from '@/lib/utils';

interface Props {
  count: number;
  total?: number;
  size?: 'small' | 'default' | 'x-small';
}

const props = withDefaults(defineProps<Props>(), {
  size: 'default',
});

const sizeClasses = {
  'x-small': 'text-xs px-1.5 py-0.5',
  'small': 'text-sm px-2 py-0.5', 
  'default': 'text-sm px-2.5 py-0.5',
};
</script>