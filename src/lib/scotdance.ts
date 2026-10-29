import dayjs from 'dayjs'

// ScotDance.app: sign in with its account, list the organiser's competitions, and drop a
// finished list into their inbox for Import dancers to pick up. Firebase loads only when
// someone opens Send, so Splits' first load stays light (and nothing leaves the browser
// until then).

export interface ScotDanceUser {
  uid: string
  email: string | null
}

/** Exactly what ScotDance.app's rules accept in `users:inbox/<uid>/<id>` (plus sentAt). */
export interface InboxItem {
  kind: 'dancers'
  source: 'Splits'
  name: string
  text: string
  competitionId: string
}

/** The Firebase side, swapped for an in-memory fake in e2e tests (see vite.config.ts). */
export interface ScotDanceBackend {
  currentUser(): Promise<ScotDanceUser | null>
  signIn(_email: string, _password: string): Promise<ScotDanceUser>
  /** Creates a ScotDance.app account and signs in with it. */
  register(_email: string, _password: string): Promise<ScotDanceUser>
  resetPassword(_email: string): Promise<void>
  signOut(): Promise<void>
  /** A value under the environment root, or null. */
  read(_path: string): Promise<unknown>
  /** Pushes the item with `sentAt: serverTimestamp()` and returns its key. */
  sendToInbox(_uid: string, _item: InboxItem): Promise<string>
}

export interface CompetitionOption {
  id: string
  name: string
  date?: Date
}

const SCOTDANCE_URL = (import.meta.env.VITE_SCOTDANCE_URL || 'https://scotdance.app').replace(
  /\/+$/,
  '',
)

export function scotdanceUrl(path = '') {
  return `${SCOTDANCE_URL}${path}`
}

export function importDancersUrl(competitionId: string, itemId: string) {
  return scotdanceUrl(
    `/competitions/${encodeURIComponent(competitionId)}/manage/dancers/import?inbox=${encodeURIComponent(itemId)}`,
  )
}

let backendPromise: Promise<ScotDanceBackend> | undefined

export function loadBackend(): Promise<ScotDanceBackend> {
  backendPromise ??= import('@/lib/scotdance-firebase')
    .then((m) => m.backend)
    .catch((error) => {
      backendPromise = undefined // let a retry load it again
      throw error
    })
  return backendPromise
}

/** Competition dates are "YYYY-MM-DD" (local) on the wire; old ones may be epoch ms. */
function parseCompetitionDate(value: unknown): Date | undefined {
  if (typeof value === 'number') return dayjs(value).toDate()
  if (typeof value !== 'string' || !value) return undefined
  const d = /^\d{10,}$/.test(value) ? dayjs(Number(value)) : dayjs(value)
  return d.isValid() ? d.toDate() : undefined
}

/** Upcoming first (soonest at the top), then past ones (most recent first), then undated. */
export function sortCompetitions(competitions: CompetitionOption[], now = new Date()) {
  const today = dayjs(now).startOf('day').valueOf()
  const rank = (c: CompetitionOption) => {
    if (!c.date) return 2
    return c.date.getTime() >= today ? 0 : 1
  }
  return [...competitions].sort((a, b) => {
    const byRank = rank(a) - rank(b)
    if (byRank) return byRank
    if (!a.date || !b.date) return a.name.localeCompare(b.name)
    const byDate = a.date.getTime() - b.date.getTime()
    return rank(a) === 0 ? byDate : -byDate
  })
}

export async function listCompetitions(uid: string): Promise<CompetitionOption[]> {
  const backend = await loadBackend()
  const permissions = (await backend.read(`users:permissions/${uid}/competitions`)) as Record<
    string,
    unknown
  > | null
  const ids = Object.entries(permissions ?? {})
    .filter(([, allowed]) => allowed === true)
    .map(([id]) => id)

  const competitions = await Promise.all(
    ids.map(async (id): Promise<CompetitionOption | undefined> => {
      const competition = (await backend.read(`competitions/${id}`)) as {
        name?: unknown
        date?: unknown
      } | null
      if (!competition) return undefined
      return {
        id,
        name: typeof competition.name === 'string' && competition.name ? competition.name : id,
        date: parseCompetitionDate(competition.date),
      }
    }),
  )
  return sortCompetitions(competitions.filter((c): c is CompetitionOption => !!c))
}

export function formatCompetitionDate(date?: Date) {
  return date ? dayjs(date).format('ddd D MMM YYYY') : ''
}

/** Firebase errors in plain words (as ScotDance.app's own sign-in says them). */
export function signInErrorMessage(error: unknown) {
  switch ((error as { code?: string })?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password don’t match. Check them, or choose “Forgot your password?”'
    case 'auth/email-already-in-use':
      return 'That email already has an account. Choose “Back to sign in” to use its password.'
    case 'auth/weak-password':
      return 'Choose a password with at least 6 characters.'
    case 'auth/invalid-email':
      return 'That email address doesn’t look right. Check it for typos.'
    case 'auth/too-many-requests':
      return 'Too many tries for now. Wait a few minutes, then try again.'
    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.'
    default:
      return 'Sign-in didn’t work. Try again.'
  }
}
