<template>
  <div
    v-if="!inputFiles?.length"
    ref="inputFileDropZoneRef"
    class="d-flex flex-column justify-center align-center h-100 position-relative ga-4"
  >
    <svg
      v-show="isOverDropZone"
      preserveAspectRatio="none"
      class="drop-zone"
    >
      <rect width="100%" height="100%" />
    </svg>
    <div class="d-flex flex-1 flex-column justify-center">
      Take your list of dancers/registrations and automatically group them into age categories with assigned bib numbers.
      You can then export for upload into ScotDance.app or use them in your own paper program.
      <ul>
        <li>input = spreadsheet of registered dancers (e.g. from eventry.net or HDComps.com)</li>
        <li>automatically split dancers in age groups - take away the guess work and the math, let this algorithm do the work for you</li>
        <li>assign bib numbers to dancers based on reverse registration order</li>
        <li>output = spreadsheet you can upload into ScotDance.app, or use for you paper programs</li>
      </ul>
    </div>
    <div class="flex-1 d-flex flex-column justify-center text-center ga-2">
      <div>Drag your CSV file here</div>
      <small class="mt-n2">or</small>
      <v-btn
        color="primary"
        :loading="isLoadingInputFile"
        @click="inputFileRef.click()"
      >
        Choose file
        <input
          ref="inputFileRef"
          type="file"
          :accept="INPUT_FILE_ACCEPT"
          @change="inputFiles = [($event.target as any).files[0]]"
          class="d-none"
        />
      </v-btn>

      <v-snackbar
        :model-value="Boolean(inputError)"
        color="error"
        @update:model-value="inputError = undefined"
      >
        <v-icon class="mr-2">mdi-alert</v-icon>
        {{ inputError }}
      </v-snackbar>
    </div>
  </div>
  <v-stepper v-else v-model="step" class="h-100">
    <v-stepper-header>
      <v-stepper-item :value="1" title="Input" :editable="maxStep >= 1" />
      <v-divider />
      <v-stepper-item :value="2" title="Group" :editable="maxStep >= 2" />
      <v-divider />
      <v-stepper-item :value="3" title="Export" :editable="maxStep >= 3" />
    </v-stepper-header>
    <v-stepper-window class="pa-0">
      <v-stepper-window-item :value="1">
        <SettingsPane>
          <HotTable
            v-if="inputData"
            ref="inputHotRef"
            :data="inputData"
            :settings="{
              colHeaders: hasHeaderRow ? inputHeaders : true,
              readOnly: true,
            }"
          />
          <template #settings>
            <v-expansion-panels v-if="inputData" multiple>
              The page shows your input data.
              In order to do grouping automatically, you need to map the columns to the correct fields.
              If there are extra rows, remove them in the spreadsheet file first then try again.

              <SettingsGroup title="Input file">
                <v-file-input
                  label="CSV file"
                  v-model="inputFiles"
                  :accept="INPUT_FILE_ACCEPT"
                  :loading="isLoadingInputFile"
                  hide-details
                  variant="outlined"
                />
              </SettingsGroup>
              <SettingsGroup title="Column mapping">
                <v-checkbox
                  v-model="hasHeaderRow"
                  label="Header row"
                  density="compact"
                  hide-details="auto"
                />
                <v-select
                  v-for="{ id, name, required } in INPUT_COLUMNS"
                  :key="id"
                  :label="name"
                  :model-value="inputHeaders[colIndexes[id]]"
                  :items="inputHeaders"
                  :required="required"
                  clearable
                  variant="outlined"
                  density="compact"
                  class="mt-4"
                  hide-details="auto"
                  :rules="[v => !!v || !required || 'Required']"
                  @update:model-value="colIndexes[id] = inputHeaders.indexOf($event)"
                />
                <v-spacer class="mt-2" />
              </SettingsGroup>
            </v-expansion-panels>
          </template>
          <template #footer>
            <v-btn
              color="primary"
              class="flex-fill"
              @click="step += 1"
            >
              Next
            </v-btn>
          </template>
        </SettingsPane>
      </v-stepper-window-item>
      <v-stepper-window-item :value="2">
        <SettingsPane>
          <ul class="d-flex flex-column pa-4 ga-4">
            <CategoryCard
              v-for="categoryCode in Object.keys(CATEGORY_CODE_NAMES).filter(c => categories?.[c])"
              :key="categoryCode"
              ref="categoryCardRef"
              :name="CATEGORY_CODE_NAMES[categoryCode]"
              :ages="categories![categoryCode]"
              tag="li"
              @partition="handlePartition(categoryCode, $event)"
            />
          </ul>
          <template #settings>
            Ensure the categories are split appropriately, or adjust them as needed.
          </template>
          <template #footer>
            <v-btn color="primary" @click="step += 1" class="flex-fill">
              Next
            </v-btn>
          </template>
        </SettingsPane>
      </v-stepper-window-item>
      <v-stepper-window-item :value="3">
        <SettingsPane>
          <HotTable
            v-if="output?.length"
            :data="output"
            :settings="{
              readOnly: true,
              columns: new Array(outputNumColumns),
              height: 600,
            }"
          />
          <template #settings>
            Bib numbers are assigned based on reverse order of registration.
            You can adjust the highest bib number to start from.

            <v-expansion-panels multiple class="py-4">
              <SettingsGroup title="Bib numbers">
                <v-text-field
                  label="Highest bib number"
                  v-model="maxBibNumber"
                  type="number"
                  min="1"
                  variant="outlined"
                  hide-details="auto"
                  clearable
                  class="mt-4"
                  @blur="!maxBibNumber && (maxBibNumber = defaultMaxBibNumber)"
                />
              </SettingsGroup>
              <SettingsGroup title="CSV output">
                <v-checkbox
                  label="Print 'Years' in age group names"
                  v-model="isPrintingYears"
                  hide-details="auto"
                />
              </SettingsGroup>
              <v-spacer class="mt-2" />
            </v-expansion-panels>
          </template>
          <template #footer>
            <v-btn color="primary" class="flex-fill" @click="downloadCSV(outputCSV)">
              Export CSV
            </v-btn>
          </template>
        </SettingsPane>
      </v-stepper-window-item>
    </v-stepper-window>
  </v-stepper>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, watch, provide, nextTick } from "vue";
import { parse, unparse } from "papaparse";
import { useDropZone } from '@vueuse/core';

import { getAgeGroupName } from "@/helpers";
import HotTable from "@/components/HotTable.vue";
import CategoryCard from "@/components/CategoryCard.vue";
import SettingsPane from "@/components/SettingsPane.vue";
import SettingsGroup from "@/components/SettingsGroup.vue";

const step = ref(1);
const maxStep = ref(step.value);
watch(step, () => {
  if (maxStep.value < step.value) {
    maxStep.value = step.value;
  }
});

const INPUT_FILE_ACCEPT = "text/csv";
const inputFiles = ref();
const inputFileRef = ref();
const inputFileDropZoneRef = ref();
const inputError = ref();
const { isOverDropZone } = useDropZone(inputFileDropZoneRef, {
  onDrop(files) {
    inputError.value = undefined;
    if (files?.length === 1 && files[0].type === INPUT_FILE_ACCEPT) {
      inputFiles.value = files;
    } else {
      inputError.value = "Please drop a single CSV file";
    }
  },
});

const inputCSV = ref<string[][]>();
const isLoadingInputFile = ref(false);
watch(inputFiles, ([file]) => {
  inputError.value = undefined;
  isLoadingInputFile.value = true;
  if (file) {
    parse(file, {
      worker: true,
      complete(results) {
        inputCSV.value = results.data as string[][];
      },
    });
  } else {
    inputCSV.value = undefined;
  }
  isLoadingInputFile.value = false;
});
watch(inputCSV, () => {
  step.value = 1;
  maxStep.value = 1;
});

const inputHotRef = ref();
const defaultInputHeaders = ref();
const hasHeaderRow = ref(true);
watch(hasHeaderRow, async (v) => {
  if (!v) {
    await nextTick();
    defaultInputHeaders.value = inputHotRef.value?.hotInstance.getColHeader();
  }
});
const inputHeaders = computed<string[]>(() => {
  return (hasHeaderRow.value
    ? inputCSV.value?.[0]
    : defaultInputHeaders.value)
    || [];
});
const inputData = computed(() => {
  return inputCSV.value?.slice(hasHeaderRow.value ? 1 : 0);
});

type InputColumn = {
  id: string;
  name: string;
  regex: RegExp,
  required?: boolean;
  optional?: boolean;
};
const INPUT_COLUMNS: InputColumn[] = [
  {
    id: "firstName",
    name: "First name",
    regex: /f(irst)[-_\. ]?name/i,
  },
  {
    id: "lastName",
    name: "Last name",
    regex: /l(ast)[-_\. ]?name$/i,
  },
  // {
  //   id: "fullName",
  //   name: "Full name",
  //   regex: /full[-_\. ]?name$/i,
  //   optional: true,
  // },
  {
    id: "code",
    name: "Highland Scrutineer code",
    regex: /(highland)?[-_\. ]?(scrutineer(ing)?)[-_\. ]?code$/i,
    required: true,
  },
  // {
  //   id: "age",
  //   name: "Age",
  //   regex: /(^|(competitor|dancer)[-_\. ]?)age$/i,
  //   optional: true,
  // },
  {
    id: "timestamp",
    name: "Registration date",
    regex: /(^|(entry|registration)[-_\. ]?)date$/i,
  },
  {
    id: "location",
    name: "City / Location",
    regex: /city|suburb/i,
    optional: true,
  },
  {
    id: "region",
    name: "Province / Region",
    regex: /province|state/i,
    optional: true,
  },
  {
    id: "country",
    name: "Country",
    regex: /country/i,
    optional: true,
  },
];
const colIndexes = reactive(INPUT_COLUMNS.reduce((acc, col) => {
  acc[col.id] = 0;
  return acc;
}, {} as Record<string, number>));
watch(inputHeaders, (headers) => {
  INPUT_COLUMNS.forEach((col) => {
    colIndexes[col.id] = headers.findIndex((header) => col.regex.test(header));
  });
});

const maxBibNumber = ref();
const defaultMaxBibNumber = ref();
const isPrintingYears = ref(true);
provide("isPrintingYears", isPrintingYears);

const CATEGORY_CODE_NAMES: Record<string, string> = {
  P: "Primary",
  B: "Beginner",
  N: "Novice",
  I: "Intermediate",
  R: "Restricted Premier",
  X: "Premier",
};
const categories = computed(() => inputData.value?.reduce((acc, row) => {
  const cell = row[colIndexes.code];
  if (cell && /^[PBNIRX]\d{2}$/.test(cell)) {
    const categoryCode = cell.substring(0, 1);
    const age = cell.substring(1);
    acc[categoryCode] = acc[categoryCode] || {};
    acc[categoryCode][age] = (acc[categoryCode][age] || 0) + 1;
  }
  return acc;
}, {} as Record<string, Record<string, number>>));
const categoryCardRef = ref<(typeof CategoryCard)[]>();
watch(step, () => {
  setTimeout(() => {
    categoryCardRef.value?.forEach((card) => card.refresh?.());
  }, 500); // duration of stepper transition
});

watch(inputData, (v) => {
  const defaultValue =  Math.round(((v?.length || 100) + 50) / 100) * 100 + 100;
  if (!maxBibNumber.value || maxBibNumber.value === defaultValue) {
    maxBibNumber.value = defaultValue;
  }
  defaultMaxBibNumber.value = defaultValue;
});
const numberedCSV = computed(() => {
  const output = inputData.value
    ?.filter((row) => row[colIndexes.firstName])
    .sort((rowA, rowB) => rowA[colIndexes.timestamp]?.localeCompare(rowB[colIndexes.timestamp]))
    .map((row, index) => [...row, `${maxBibNumber.value - index}`]);
  return output;
});

type Partition = {
  categoryCode: string;
  ageRange: number[],
  codes: string[];
};
const partitions = ref<Record<string, Partition[]>>({});
watch(inputData, () => {
  partitions.value = {};
});
function handlePartition(categoryCode: string, partitionedAgeRanges: number[][]) {
  const ageCodesWithinGroup = Object.keys(categories.value?.[categoryCode] || {});
  const partitioned = partitionedAgeRanges.map(([minAge, maxAge]) => ({
    categoryCode,
    ageRange: [minAge, maxAge],
    codes: [],
  } as Partition));
  ageCodesWithinGroup.forEach((ageCode) => {
    const age = Number(ageCode);
    partitionedAgeRanges.forEach(([minAge, maxAge], index) => {
      if (minAge <= age && age <= maxAge) {
        const code = `${categoryCode}${ageCode}`;
        partitioned[index].codes.push(code);
      }
    });
  });
  partitions.value[categoryCode] = partitioned;
}
const outputNumColumns = ref(4);
const output = computed(() => {
  let data: any[][] = [];
  Object.values(partitions.value).flat().forEach((partition) => {
    if (data.length) data.push([]);

    const name = `${CATEGORY_CODE_NAMES[partition.categoryCode]} ${getAgeGroupName(partition.ageRange[0], partition.ageRange[1], isPrintingYears.value)}`;
    data.push([name]);

    const rows = numberedCSV.value?.filter((row) => row.find((value) => partition.codes.includes(value))) || [];
    data.push(...rows.map((row) => [
      row[row.length - 1],
      row[colIndexes.firstName] || (!row[colIndexes.lastName] && row[colIndexes.fullName]),
      row[colIndexes.lastName],
      [row[colIndexes.location], row[colIndexes.region], row[colIndexes.country]].filter(Boolean).join(', '),
    ]));
  });
  return data;
});
const outputCSV = computed(() => unparse(output.value));

function downloadCSV(data: string, filename: string = 'output') {
  const a = document.createElement('a');
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
}
</script>

<style lang="postcss" scoped>
.v-stepper {
  &,
  & ::v-deep(.v-stepper-window),
  & ::v-deep(.v-stepper-window > .v-window__container),
  & ::v-deep(.v-stepper-window-item),
  & ::v-deep(.v-stepper-window-item > *) {
    display: flex;
    flex-direction: column;
    flex: auto;
    height: 100%;
    overflow: hidden;
    margin: 0;
  }
}
::v-deep(.v-file-input .v-field__input) {
  overflow: hidden;
}

.flex-1 {
  flex: 1;
}

@keyframes stroke {
    to {
      stroke-dashoffset: 0;
    }
  }
.drop-zone {
  position: absolute;
  inset: 2rem;
  width: calc(100% - 4rem);
  height: calc(100% - 4rem);
  pointer-events: none;

  & rect {
    fill: none;
    stroke: #000;
    stroke-width: 0.25rem;
    vector-effect: non-scaling-stroke;
    stroke-dasharray: 0.5rem;
    animation: stroke 0.5s linear infinite;
    shape-rendering: geometricPrecision;
    stroke-dashoffset: 1rem;
  }
}
</style>
