<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { Button } from '@/components/ui/button'
import { entriesOrigins, listenForEntries } from '@/lib/entries'

const router = useRouter()
const store = useAppStore()
const waiting = ref(false)
const error = ref('')
let stop: (() => void) | undefined
onMounted(() => {
  if (new URLSearchParams(location.search).get('from') !== 'entries') return
  stop = listenForEntries({
    origins: entriesOrigins(import.meta.env.DEV, import.meta.env.VITE_ENTRIES_ORIGIN),
    hasWork: () => !!store.validatedCSV?.length,
    confirmReplace: () =>
      window.confirm(
        'Replace your current dancers and age groups with the entries just sent? Your current changes will be lost.',
      ),
    importEntries: async (payload) => {
      await store.loadEntries(payload)
      await router.isReady()
      if (router.currentRoute.value.name !== 'splits') await router.replace('/splits')
    },
    onWaiting: (value) => (waiting.value = value),
    onError: (message) => (error.value = message),
  })
})
onUnmounted(() => stop?.())
</script>

<template>
  <div
    v-if="waiting || error"
    class="fixed bottom-5 left-4 right-4 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border bg-background p-4 shadow-lg"
    :role="error ? 'alert' : 'status'"
  >
    <p class="flex-1 text-sm">{{ error || 'Receiving dancers from Entries…' }}</p>
    <Button v-if="error" variant="outline" size="sm" @click="error = ''">Dismiss</Button>
  </div>
</template>
