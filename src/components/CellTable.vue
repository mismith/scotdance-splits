<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
      <TableRow>
        <TableHead
          v-if="showRowHeaders"
          class="w-12 h-8 sticky top-0 left-0 z-20 bg-muted/50 backdrop-blur border-r border-b border-border text-center font-semibold"
        >
          #
        </TableHead>
        <TableHead
          v-for="(header, index) in headers"
          :key="index"
          class="truncate max-w-xs h-8 sticky top-0 z-10 bg-muted/50 backdrop-blur border-r border-b border-border font-semibold"
        >
          {{ header }}
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow
        v-for="(row, rowIndex) in data"
        :key="rowIndex"
        :class="{ 'bg-primary/25': rowHasIssues(row) }"
      >
        <TableCell
          v-if="showRowHeaders"
          class="w-12 h-8 sticky left-0 z-10 bg-muted/50 backdrop-blur border-r border-b border-border text-center font-semibold"
        >
          {{ rowIndex + 1 }}
        </TableCell>
        <TableCell
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          class="truncate max-w-xs h-8 border-r border-b border-border"
          :class="{
            'ring-2 ring-inset ring-destructive': cell.error,
            'ring-2 ring-inset ring-primary': cell.warning,
          }"
        >
          {{ cell.value }}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>
