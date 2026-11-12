/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ScotDance.app, whose embed.js Send opens (default https://scotdance.app). */
  readonly VITE_SCOTDANCE_URL?: string
  /** Optional localhost Entries origin for development only. */
  readonly VITE_ENTRIES_ORIGIN?: string
}
