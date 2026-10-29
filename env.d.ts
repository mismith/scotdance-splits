/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** ScotDance.app's web app, for Import dancers links (default https://scotdance.app). */
  readonly VITE_SCOTDANCE_URL?: string
  /** ScotDance.app's data root (default production; the emulators use development). */
  readonly VITE_FIREBASE_DATA_NAMESPACE?: string
  /** 'true' to use ScotDance's Firebase emulators (Auth :9099, Database :9009). */
  readonly VITE_FIREBASE_EMULATORS?: string
  /** Shifts the emulator ports, as ScotDance's web app does for a second stack. */
  readonly VITE_EMULATOR_PORT_OFFSET?: string
}
