<script setup lang="ts">
import {
  Table,
  TableBody,
  TableHeader,
} from '@/components/ui/table'
import type { Cell } from '@/lib/types'

interface Props {
  data: Cell[][]
  headers?: string[]
  showHeaders?: boolean
  showRowHeaders?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHeaders: true,
  showRowHeaders: true,
})

function rowHasIssues(row: Cell[]): boolean {
  return row.some((cell) => cell.error || cell.warning)
}
</script>

<template>
  <Table class="text-xs [border-spacing:0] [border-collapse:separate]">
    <TableHeader v-if="showHeaders && headers">
      <tr class="border-b">
        <th
          v-if="showRowHeaders"
          class="text-foreground px-2 py-1 align-middle whitespace-nowrap w-12 h-8 sticky top-0 left-0 z-20 bg-muted border-r border-b border-border text-center font-semibold"
        >
          #
        </th>
        <th
          v-for="(header, index) in headers"
          :key="index"
          class="text-foreground px-2 py-1 text-left align-middle truncate max-w-xs h-8 sticky top-0 z-10 bg-muted border-r border-b border-border font-semibold"
        >
          {{ header }}
        </th>
      </tr>
    </TableHeader>
    <TableBody>
      <tr
        v-for="(row, rowIndex) in data"
        :key="rowIndex"
        class="border-b"
        :class="{ 'bg-primary/25': rowHasIssues(row) }"
      >
        <td
          v-if="showRowHeaders"
          class="px-2 py-1 align-middle whitespace-nowrap w-12 h-8 sticky left-0 z-10 bg-muted border-r border-b border-border text-center font-semibold"
        >
          {{ rowIndex + 1 }}
        </td>
        <td
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="px-2 py-1 align-middle truncate max-w-xs h-8 border-r border-b border-border"
          :class="{
            'ring-2 ring-inset ring-destructive': cell.error,
            'ring-2 ring-inset ring-primary': cell.warning,
          }"
        >
          {{ cell.value }}
        </td>
      </tr>
    </TableBody>
  </Table>
</template>
