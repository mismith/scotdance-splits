# Splits

Free online tool that splits highland dance competition registrations into age groups with bib numbers.

## Features

- **CSV Import**: Upload files from eventry.net, HDComps.com, or any registration system
- **Auto-grouping**: Algorithm splits dancers into balanced age groups
- **Bib numbering**: Reverse-registration-order with customizable starting numbers
- **Privacy-first**: All processing happens locally; your data stays on your computer until you send it
- **Send to ScotDance.app**: ScotDance.app's own sheet opens over Splits (its `embed.js`): sign in, pick your competition, and the list waits in its Import dancers
- **Export ready**: Download a CSV for ScotDance.app or paper programs

## Development

- `npm run dev`: the app, sending to the real ScotDance.app
- `npm run dev:emulator`: sends to ScotDance's local web app instead (run its `npm run local` first); see `.env.emulator`
- `npm test`: Playwright e2e on `vite --mode e2e`, where the tests stand in for ScotDance.app's `embed.js`

Environment variables (optional, see `env.d.ts`):

- `VITE_SCOTDANCE_URL`: the ScotDance.app whose `embed.js` Send opens (default `https://scotdance.app`)

Analytics: Cloudflare Web Analytics (cookieless) is injected at the edge by the `scotdance.app` zone's automatic setup, route changes included, so there's no snippet here and none in dev.

