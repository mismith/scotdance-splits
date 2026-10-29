<script setup lang="ts">
import { Eye, EyeOff, LoaderCircle } from 'lucide-vue-next'
import { type AcceptableValue } from 'reka-ui'
import { computed, ref, useId, watch } from 'vue'
import ScotDanceMark from '@/components/ScotDanceMark.vue'
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
/** The sign-in step's three forms, as in ScotDance.app's own sign-in. */
type Form = 'signin' | 'register' | 'forgot'

const step = ref<Step>('loading')
const user = ref<ScotDanceUser | null>(null)
const competitions = ref<CompetitionOption[]>([])
const competitionId = ref<string>()
const form = ref<Form>('signin')
const email = ref('')
const password = ref('')
const passwordVisible = ref(false)
const passwordId = useId()
const errorId = useId()
const busy = ref(false)
const error = ref('')
const info = ref('')
const sent = ref<{ url: string; competitionName: string; tabOpened: boolean }>()

// ScotDance.app's capsule buttons and text buttons
const pill = 'h-11 px-5 text-[15px] font-semibold'
const textButton =
  'block h-11 w-full rounded-full font-semibold text-(--scotdance-link) hover:bg-white/5'

const NO_CONNECTION = 'Couldn’t reach ScotDance.app. Check your internet and try again.'

const title = computed(() => {
  if (step.value === 'sent') return 'Sent'
  if (step.value !== 'signIn') return 'Send to ScotDance.app'
  if (form.value === 'register') return 'Create an account'
  if (form.value === 'forgot') return 'Reset your password'
  return 'Sign in to ScotDance.app'
})

const description = computed(() => {
  switch (step.value) {
    case 'loading':
      return 'One moment…'
    case 'signIn':
      return form.value === 'register'
        ? 'Your ScotDance.app account works here and in the app.'
        : 'Your list goes to the competitions you manage there.'
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
  else showForm('signin')
}

function showForm(next: Form) {
  form.value = next
  error.value = ''
  info.value = ''
  passwordVisible.value = false
  step.value = 'signIn'
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

async function submit() {
  busy.value = true
  error.value = ''
  info.value = ''
  try {
    const backend = await loadBackend()
    if (form.value === 'forgot') {
      await backend.resetPassword(email.value.trim())
      info.value = `A reset link is on its way to ${email.value.trim()}.`
      return
    }
    user.value =
      form.value === 'register'
        ? await backend.register(email.value.trim(), password.value)
        : await backend.signIn(email.value.trim(), password.value)
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
  showForm('signin')
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
    <DialogContent class="scotdance md:max-w-md">
      <DialogHeader class="flex-row items-center gap-3 text-left">
        <ScotDanceMark badge class="size-10 shrink-0" />
        <div class="space-y-0.5">
          <DialogTitle class="text-xl font-bold">{{ title }}</DialogTitle>
          <DialogDescription>{{ description }}</DialogDescription>
        </div>
      </DialogHeader>

      <div v-if="step === 'loading'" class="flex justify-center py-4">
        <LoaderCircle class="size-6 animate-spin text-muted-foreground" />
      </div>

      <!-- As ScotDance.app's own sign-in, with standard autocomplete, so saved
           ScotDance.app passwords are offered -->
      <form v-else-if="step === 'signIn'" class="space-y-3" @submit.prevent="submit">
        <label class="block space-y-1.5">
          <span class="text-[15px] font-medium">Email address</span>
          <input
            v-model="email"
            type="email"
            name="email"
            autocomplete="username"
            inputmode="email"
            autocapitalize="off"
            spellcheck="false"
            required
            :aria-invalid="error ? 'true' : undefined"
            :aria-describedby="error ? errorId : undefined"
            class="scotdance-field h-12 w-full rounded-xl px-3 text-base"
          />
        </label>

        <!-- Not one <label>: the Show button inside it would join the field's name -->
        <div v-if="form !== 'forgot'" class="space-y-1.5">
          <label :for="passwordId" class="block text-[15px] font-medium">
            {{ form === 'register' ? 'Choose a password' : 'Password' }}
          </label>
          <span class="relative block">
            <input
              :id="passwordId"
              v-model="password"
              :type="passwordVisible ? 'text' : 'password'"
              name="password"
              :autocomplete="form === 'register' ? 'new-password' : 'current-password'"
              required
              :aria-invalid="error ? 'true' : undefined"
              :aria-describedby="error ? errorId : undefined"
              class="scotdance-field h-12 w-full rounded-xl pr-24 pl-3 text-base"
            />
            <button
              type="button"
              class="absolute top-1/2 right-1 flex h-10 -translate-y-1/2 items-center gap-1 rounded-full px-3 text-sm font-semibold text-(--scotdance-link) hover:bg-white/5"
              :aria-label="passwordVisible ? 'Hide password' : 'Show password'"
              :aria-pressed="passwordVisible"
              @click="passwordVisible = !passwordVisible"
            >
              <component :is="passwordVisible ? EyeOff : Eye" class="size-4" />
              {{ passwordVisible ? 'Hide' : 'Show' }}
            </button>
          </span>
        </div>

        <p v-if="error" :id="errorId" role="alert" class="text-[15px] font-medium text-destructive">
          {{ error }}
        </p>
        <p v-if="info" role="status" class="text-[15px] font-medium text-[#86dda0]">{{ info }}</p>

        <Button type="submit" :disabled="busy" class="h-12 w-full text-base font-semibold">
          <LoaderCircle v-if="busy" class="size-5 animate-spin" />
          <template v-if="form === 'signin'">Sign in</template>
          <template v-else-if="form === 'register'">Create account</template>
          <template v-else>Send reset link</template>
        </Button>

        <div class="space-y-1 text-center text-[15px]">
          <template v-if="form === 'signin'">
            <button type="button" :class="textButton" @click="showForm('forgot')">
              Forgot your password?
            </button>
            <button type="button" :class="textButton" @click="showForm('register')">
              New here? Create an account
            </button>
          </template>
          <button v-else type="button" :class="textButton" @click="showForm('signin')">
            Back to sign in
          </button>
        </div>
      </form>

      <template v-else-if="step === 'pick'">
        <div v-if="competitions.length" class="space-y-2">
          <Label for="scotdance-competition" class="text-[15px]">Competition</Label>
          <Select :model-value="competitionId" @update:model-value="pickCompetition">
            <SelectTrigger
              id="scotdance-competition"
              class="scotdance-field h-12! w-full rounded-xl border-0"
            >
              <SelectValue placeholder="Pick a competition" />
            </SelectTrigger>
            <SelectContent class="scotdance">
              <SelectItem v-for="c in competitions" :key="c.id" :value="c.id">
                {{ c.name }}
                <span v-if="c.date" class="text-muted-foreground">
                  · {{ formatCompetitionDate(c.date) }}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-sm text-muted-foreground">
            Your list waits in its Import dancers until you save it there.
          </p>
        </div>
        <p v-if="error" role="alert" class="text-[15px] font-medium text-destructive">
          {{ error }}
        </p>
        <p class="text-sm text-muted-foreground">
          Signed in as {{ user?.email }}.
          <button type="button" class="font-semibold text-(--scotdance-link)" @click="signOut">
            Sign out
          </button>
        </p>
        <DialogFooter>
          <Button
            v-if="competitions.length"
            :disabled="busy || !competitionId"
            :class="pill"
            @click="send"
          >
            {{ busy ? 'Sending…' : 'Send' }}
          </Button>
          <Button
            v-else
            as="a"
            :href="scotdanceUrl('/competitions/add')"
            target="_blank"
            rel="noopener"
            :class="pill"
          >
            Add a competition
          </Button>
        </DialogFooter>
      </template>

      <DialogFooter v-else-if="step === 'sent' && sent">
        <DialogClose as-child>
          <Button variant="secondary" :class="pill">Done</Button>
        </DialogClose>
        <Button
          as="a"
          :href="sent.url"
          target="_blank"
          rel="noopener"
          :variant="sent.tabOpened ? 'secondary' : 'default'"
          :class="pill"
        >
          Open Import dancers
        </Button>
      </DialogFooter>

      <DialogFooter v-else-if="step === 'failed'">
        <Button :class="pill" @click="start">Try again</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
