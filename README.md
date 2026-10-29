# Splits

Free online tool that splits highland dance competition registrations into age groups with bib numbers.

## Features

- **CSV Import**: Upload files from eventry.net, HDComps.com, or any registration system
- **Auto-grouping**: Algorithm splits dancers into balanced age groups
- **Bib numbering**: Reverse-registration-order with customizable starting numbers
- **Privacy-first**: All processing happens locally; your data stays on your computer until you send it
- **Send to ScotDance.app**: Sign in with your ScotDance.app account and send the list to your competition's Import dancers
- **Export ready**: Download a CSV for ScotDance.app or paper programs

## Development

- `npm run dev`: the app, sending to the real ScotDance.app (production data)
- `npm run dev:emulator`: sends to ScotDance's Firebase emulators instead (run ScotDance's `npm run local` first); see `.env.emulator`
- `npm test`: Playwright e2e on `vite --mode e2e`, where ScotDance.app is an in-memory fake (`src/lib/scotdance-firebase.fake.ts`)

Environment variables (all optional, see `env.d.ts`):

- `VITE_SCOTDANCE_URL`: where Import dancers opens (default `https://scotdance.app`)
- `VITE_FIREBASE_DATA_NAMESPACE`: ScotDance.app's data root (default `production`)
- `VITE_FIREBASE_EMULATORS`: `true` to use the Auth (:9099) and Database (:9009) emulators
- `VITE_EMULATOR_PORT_OFFSET`: shifts those ports, for a second ScotDance stack

