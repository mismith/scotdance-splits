<script setup lang="ts">
import { ref } from 'vue'
import { CATEGORY_CODE_NAMES } from '@/lib/helpers'
import CategoryCard from '@/components/CategoryCard.vue'
import SettingsPane from '@/components/SettingsPane.vue'
import HelpText from '@/components/HelpText.vue'
import { Button } from '@/components/ui/button'

interface Props {
  categories: Record<string, Record<string, number>>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'partition': [categoryCode: string, partitionedAgeRanges: number[][]]
  'next-step': []
}>()

const categoryCardRef = ref<(typeof CategoryCard)[]>()

function handlePartition(categoryCode: string, partitionedAgeRanges: number[][]) {
  emit('partition', categoryCode, partitionedAgeRanges)
}

function refresh() {
  setTimeout(() => {
    categoryCardRef.value?.forEach((card) => card.refresh?.())
  }, 500)
}

defineExpose({
  refresh
})
</script>

<template>
  <div class="h-full">
    <SettingsPane>
      <div class="p-4 space-y-4">
        <CategoryCard
          v-for="categoryCode in Object.keys(CATEGORY_CODE_NAMES).filter(
            (c) => categories?.[c],
          )"
          :key="categoryCode"
          ref="categoryCardRef"
          :name="CATEGORY_CODE_NAMES[categoryCode]"
          :ages="categories[categoryCode]"
          @partition="handlePartition(categoryCode, $event)"
        />
      </div>

      <template #settings>
        <HelpText>
          Ensure the categories are split appropriately, or adjust them as needed.
        </HelpText>
      </template>

      <template #footer>
        <Button @click="$emit('next-step')" class="w-full">Next</Button>
      </template>
    </SettingsPane>
  </div>
</template>