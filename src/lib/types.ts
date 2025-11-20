/**
 * Cell data structure that combines value with validation state
 */
export interface Cell {
  value: string
  error?: boolean
  warning?: boolean
}
