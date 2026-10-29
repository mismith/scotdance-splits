import type { InboxItem, ScotDanceBackend } from '@/lib/scotdance'

// Stands in for scotdance-firebase.ts in e2e tests (vite --mode e2e aliases it), so no
// test ever reaches Firebase. Tests seed `window.__scotdanceFake` before the page loads
// and read back what was sent.

export interface ScotDanceFakeState {
  accounts: { uid: string; email: string; password: string }[]
  /** The environment root's tree, e.g. { 'users:permissions': { … }, competitions: { … } }. */
  db: Record<string, unknown>
  signedInUid?: string | null
  /** Makes the next send fail, as a rules rejection would. */
  failSend?: boolean
  sent?: { uid: string; key: string; value: Record<string, unknown> }[]
  /** Emails a reset link was asked for. */
  resetsSent?: string[]
}

declare global {
  interface Window {
    __scotdanceFake?: ScotDanceFakeState
  }
}

const INBOX_FIELDS = ['competitionId', 'kind', 'name', 'source', 'text']

function state(): ScotDanceFakeState {
  window.__scotdanceFake ??= { accounts: [], db: {} }
  return window.__scotdanceFake
}

function userFor(uid: string) {
  const account = state().accounts.find((a) => a.uid === uid)
  return { uid, email: account?.email ?? null }
}

const authError = (code: string) => Object.assign(new Error(code), { code })

export const backend: ScotDanceBackend = {
  async currentUser() {
    const uid = state().signedInUid
    return uid ? userFor(uid) : null
  },
  async signIn(email, password) {
    const account = state().accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase(),
    )
    if (!account || account.password !== password) throw authError('auth/invalid-credential')
    state().signedInUid = account.uid
    return userFor(account.uid)
  },
  async register(email, password) {
    const s = state()
    if (s.accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) {
      throw authError('auth/email-already-in-use')
    }
    if (password.length < 6) throw authError('auth/weak-password')
    const uid = `fake-${s.accounts.length + 1}`
    s.accounts.push({ uid, email: email.trim(), password })
    s.signedInUid = uid
    return userFor(uid)
  },
  async resetPassword(email) {
    const s = state()
    s.resetsSent ??= []
    s.resetsSent.push(email.trim())
  },
  async signOut() {
    state().signedInUid = null
  },
  async read(path) {
    let node: unknown = state().db
    for (const key of path.split('/')) {
      node = (node as Record<string, unknown> | null)?.[key] ?? null
    }
    return node ?? null
  },
  async sendToInbox(uid, item: InboxItem) {
    const s = state()
    // As ScotDance.app's rules would: only the owner, and only the agreed fields.
    if (s.failSend || s.signedInUid !== uid) throw authError('PERMISSION_DENIED')
    if (Object.keys(item).sort().join() !== INBOX_FIELDS.join()) {
      throw authError('PERMISSION_DENIED')
    }
    s.sent ??= []
    const key = `-Fake${s.sent.length + 1}`
    s.sent.push({ uid, key, value: { ...item, sentAt: { '.sv': 'timestamp' } } })
    return key
  },
}
