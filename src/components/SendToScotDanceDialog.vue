<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'
import { type AcceptableValue } from 'reka-ui'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  type CompetitionOption,
  type ScotDanceUser,
  formatCompetitionDate,
  importDancersUrl,
  listCompetitions,
  loadBackend,
  scotdanceUrl,
  signInErrorMessage,
} from '@/lib/scotdance'

const props = defineProps<{
  open: boolean
  /** The file the list came from, as ScotDance.app shows it. */
  name: string
  /** The CSV that Download saves; only built when sending. */
  getText: () => string
}>()
const emit = defineEmits<{ 'update:open': [value: boolean] }>()

type Step = 'loading' | 'signIn' | 'pick' | 'sent' | 'failed'

const step = ref<Step>('loading')
const user = ref<ScotDanceUser | null>(null)
const competitions = ref<CompetitionOption[]>([])
const competitionId = ref<string>()
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const sent = ref<{ url: string; competitionName: string; tabOpened: boolean }>()

const NO_CONNECTION = 'Couldn’t reach ScotDance.app. Check your internet and try again.'

const title = computed(() => (step.value === 'sent' ? 'Sent' : 'Send to ScotDance.app'))

const description = computed(() => {
  switch (step.value) {
    case 'loading':
      return 'One moment…'
    case 'signIn':
      return 'Sign in with your ScotDance.app account.'
    case 'pick':
      return competitions.value.length
        ? 'Which competition are these dancers for?'
        : 'Add your competition on ScotDance.app first, then come back to send your list to it.'
    case 'sent':
      return sent.value?.tabOpened
        ? `Import dancers for ${sent.value.competitionName} is open in a new tab. Check the dancers there, then Save.`
        : `Your list is waiting in Import dancers for ${sent.value?.competitionName}. Open it to check the dancers, then Save.`
    default:
      return error.value
  }
})

watch(
  () => props.open,
  (open) => {
    if (open) start()
  },
  { immediate: true },
)

async function start() {
  step.value = 'loading'
  error.value = ''
  sent.value = undefined
  try {
    user.value = await (await loadBackend()).currentUser()
  } catch {
    error.value = NO_CONNECTION
    step.value = 'failed'
    return
  }
  if (user.value) await showCompetitions()
  else step.value = 'signIn'
}

async function showCompetitions() {
  if (!user.value) return
  try {
    competitions.value = await listCompetitions(user.value.uid)
  } catch {
    error.value = NO_CONNECTION
    step.value = 'failed'
    return
  }
  if (!competitions.value.some((c) => c.id === competitionId.value)) {
    competitionId.value = competitions.value[0]?.id
  }
  step.value = 'pick'
}

async function signIn() {
  busy.value = true
  error.value = ''
  try {
    user.value = await (await loadBackend()).signIn(email.value.trim(), password.value)
    password.value = ''
  } catch (e) {
    error.value = signInErrorMessage(e)
    return
  } finally {
    busy.value = false
  }
  await showCompetitions()
}

async function signOut() {
  await (await loadBackend()).signOut()
  user.value = null
  competitions.value = []
  error.value = ''
  step.value = 'signIn'
}

function pickCompetition(value: AcceptableValue) {
  if (value !== null) competitionId.value = String(value)
}

async function send() {
  const competition = competitions.value.find((c) => c.id === competitionId.value)
  if (!competition || !user.value) return
  busy.value = true
  error.value = ''
  try {
    const itemId = await (
      await loadBackend()
    ).sendToInbox(user.value.uid, {
      kind: 'dancers',
      source: 'Splits',
      name: props.name,
      text: props.getText(),
      competitionId: competition.id,
    })
    const url = importDancersUrl(competition.id, itemId)
    const tab = window.open(url, '_blank')
    if (tab) tab.opener = null
    sent.value = { url, competitionName: competition.name, tabOpened: !!tab }
    step.value = 'sent'
  } catch {
    error.value = 'Couldn’t send your list. Try again, or download it instead.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="md:max-w-md">
      <DialogHeader class="gap-1">
        <DialogTitle class="text-xl">{{ title }}</DialogTitle>
        <DialogDescription>{{ description }}</DialogDescription>
      </DialogHeader>

      <div v-if="step === 'loading'" class="flex justify-center py-4">
        <LoaderCircle class="size-6 animate-spin text-muted-foreground" />
      </div>

      <!-- A real form with standard autocomplete, so saved ScotDance.app passwords are offered -->
      <form v-else-if="step === 'signIn'" class="space-y-4" @submit.prevent="signIn">
        <div class="space-y-2">
          <Label for="scotdance-email">Email address</Label>
          <Input
            id="scotdance-email"
            v-model="email"
            type="email"
            name="email"
            autocomplete="username"
            inputmode="email"
            autocapitalize="off"
            spellcheck="false"
            required
          />
        </div>
        <div class="space-y-2">
          <Label for="scotdance-password">Password</Label>
          <Input
            id="scotdance-password"
            v-model="password"
            type="password"
            name="password"
            autocomplete="current-password"
            required
          />
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <p class="text-xs text-muted-foreground">
          No account yet, or forgot your password? Head to
          <a
            :href="scotdanceUrl('/manage')"
            target="_blank"
            rel="noopener"
            class="underline font-medium"
            >ScotDance.app</a
          >, then come back here.
        </p>
        <DialogFooter>
          <Button type="submit" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</Button>
        </DialogFooter>
      </form>

      <template v-else-if="step === 'pick'">
        <div v-if="competitions.length" class="space-y-2">
          <Label for="scotdance-competition">Competition</Label>
          <Select :model-value="competitionId" @update:model-value="pickCompetition">
            <SelectTrigger id="scotdance-competition" class="w-full">
              <SelectValue placeholder="Pick a competition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in competitions" :key="c.id" :value="c.id">
                {{ c.name }}
                <span v-if="c.date" class="text-muted-foreground">
                  · {{ formatCompetitionDate(c.date) }}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            Your list waits in its Import dancers until you save it there.
          </p>
        </div>
        <p v-if="error" role="alert" class="text-sm text-destructive">{{ error }}</p>
        <p class="text-xs text-muted-foreground">
          Signed in as {{ user?.email }}.
          <button type="button" class="underline font-medium" @click="signOut">Sign out</button>
        </p>
        <DialogFooter>
          <Button v-if="competitions.length" :disabled="busy || !competitionId" @click="send">
            {{ busy ? 'Sending…' : 'Send' }}
          </Button>
          <Button
            v-else
            as="a"
            :href="scotdanceUrl('/competitions/add')"
            target="_blank"
            rel="noopener"
          >
            Add a competition
          </Button>
        </DialogFooter>
      </template>

      <DialogFooter v-else-if="step === 'sent' && sent">
        <DialogClose as-child>
          <Button variant="outline">Done</Button>
        </DialogClose>
        <Button
          as="a"
          :href="sent.url"
          target="_blank"
          rel="noopener"
          :variant="sent.tabOpened ? 'secondary' : 'default'"
        >
          Open Import dancers
        </Button>
      </DialogFooter>

      <DialogFooter v-else-if="step === 'failed'">
        <Button @click="start">Try again</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
