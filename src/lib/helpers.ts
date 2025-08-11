export function downloadCSV(data: string, filename: string = 'output') {
  const a = document.createElement('a')
  const blob = new Blob([data], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function pluralize(count: number, word: string, words: string = `${word}s`): string {
  return count === 1 ? word : words
}
