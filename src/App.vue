<script setup lang="ts">
import { useAppStore } from '@/stores/app'
import HomeView from '@/views/HomeView.vue'
import SplitsView from '@/views/SplitsView.vue'

const store = useAppStore()
</script>

<template>
  <HomeView v-if="!store.hasData" />
  <SplitsView v-else />
</template>
