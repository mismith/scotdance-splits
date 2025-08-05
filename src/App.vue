<script setup lang="ts">
import { ref } from 'vue'
import { parse } from 'papaparse'

import HomeView from '@/views/HomeView.vue'
import FileUpload from '@/components/FileUpload.vue'
import StepperView from '@/views/StepperView.vue'

// File input handling
const inputFiles = ref<File[]>()
const inputCSV = ref<string[][]>()
const inputError = ref<string>()
const isLoadingInputFile = ref(false)

async function handleFileSelected(file: File) {
  inputError.value = undefined
  isLoadingInputFile.value = true

  try {
    const results = await new Promise<any>((resolve, reject) => {
      parse(file, {
        worker: true,
        complete: resolve,
        error: reject,
      })
    })
    inputCSV.value = results.data as string[][]
    inputFiles.value = [file]
  } catch (error) {
    inputError.value = 'Failed to parse CSV file'
  } finally {
    isLoadingInputFile.value = false
  }
}

function handleErrorDismiss() {
  inputError.value = undefined
}

function handleHomeClick() {
  inputFiles.value = undefined
  inputCSV.value = undefined
}
</script>

<template>
  <div class="lg:h-screen flex flex-col">
    <!-- Home page with file upload -->
    <FileUpload
      v-if="!inputFiles?.length"
      :is-loading="isLoadingInputFile"
      :error="inputError"
      @file-selected="handleFileSelected"
      @error-dismiss="handleErrorDismiss"
    >
      <template #default="{ chooseFile }">
        <HomeView
          :is-loading-input-file="isLoadingInputFile"
          :input-error="inputError"
          @file-selected="handleFileSelected"
          @error-dismiss="handleErrorDismiss"
          @choose-file="chooseFile"
        />
      </template>
    </FileUpload>

    <!-- Main stepper interface -->
    <StepperView
      v-else
      :input-files="inputFiles"
      :input-csv="inputCSV"
      :input-error="inputError"
      :is-loading-input-file="isLoadingInputFile"
      @file-selected="handleFileSelected"
      @error-dismiss="handleErrorDismiss"
      @home-click="handleHomeClick"
    />
  </div>
</template>
