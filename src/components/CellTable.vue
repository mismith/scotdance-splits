<template>
  <Table>
    <TableHeader v-if="showHeaders && headers">
      <TableRow>
        <TableHead v-if="showRowHeaders"> # </TableHead>
        <TableHead v-for="(header, index) in headers" :key="index">
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
        <TableCell v-if="showRowHeaders">
          {{ rowIndex + (showHeaders && headers ? 1 : 0) }}
        </TableCell>
        <TableCell
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          :class="{
            'cell-error': cell.error,
            'cell-warning': cell.warning,
          }"
        >
          {{ cell.value }}
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
</template>

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
