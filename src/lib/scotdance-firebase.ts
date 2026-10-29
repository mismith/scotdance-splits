import { initializeApp } from 'firebase/app'
import {
  browserLocalPersistence,
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  indexedDBLocalPersistence,
  initializeAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  connectDatabaseEmulator,
  get,
  getDatabase,
  push,
  ref,
  serverTimestamp,
  set,
} from 'firebase/database'
import type { ScotDanceBackend, ScotDanceUser } from '@/lib/scotdance'

// Only ever loaded through loadBackend() in scotdance.ts, so it gets its own chunk.

// ScotDance.app's own web config: one account across its organiser tools.
const app = initializeApp({
  apiKey: 'AIzaSyCxvA2RMvlCQ3WCzAqPotD8IOhnmCtQ1xM',
  authDomain: 'scotdance.firebaseapp.com',
  databaseURL: 'https://scotdance.firebaseio.com',
  projectId: 'firebase-scotdance',
  storageBucket: 'firebase-scotdance.appspot.com',
  messagingSenderId: '635645850119',
  appId: '1:635645850119:web:96255e79df76024e0e70a2',
})

/** ScotDance.app's data root: `production`, or `development` on the emulators. */
const NAMESPACE = import.meta.env.VITE_FIREBASE_DATA_NAMESPACE || 'production'

// Email and password only, so no popup/redirect helper (and its hidden iframe).
const auth = initializeAuth(app, {
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
})
const database = getDatabase(app)

if (import.meta.env.VITE_FIREBASE_EMULATORS === 'true') {
  // Ports from ScotDance's firebase.json, shifted like its web app for a second stack.
  const port = (base: number) => base + (Number(import.meta.env.VITE_EMULATOR_PORT_OFFSET) || 0)
  const host = window.location.hostname || 'localhost'
  connectAuthEmulator(auth, `http://${host}:${port(9099)}`, { disableWarnings: true })
  connectDatabaseEmulator(database, host, port(9009))
}

const toUser = (user: { uid: string; email: string | null }): ScotDanceUser => ({
  uid: user.uid,
  email: user.email,
})

export const backend: ScotDanceBackend = {
  async currentUser() {
    await auth.authStateReady()
    return auth.currentUser ? toUser(auth.currentUser) : null
  },
  async signIn(email, password) {
    const { user } = await signInWithEmailAndPassword(auth, email, password)
    return toUser(user)
  },
  async register(email, password) {
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    return toUser(user)
  },
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email)
  },
  async signOut() {
    await signOut(auth)
  },
  async read(path) {
    const snapshot = await get(ref(database, `${NAMESPACE}/${path}`))
    return snapshot.val()
  },
  async sendToInbox(uid, item) {
    const itemRef = push(ref(database, `${NAMESPACE}/users:inbox/${uid}`))
    // Field by field: the rules turn away anything extra.
    const { kind, source, name, text, competitionId } = item
    await set(itemRef, { kind, source, name, text, competitionId, sentAt: serverTimestamp() })
    return itemRef.key!
  },
}
