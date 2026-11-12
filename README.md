# Splits

Free online tool that splits highland dance competition registrations into age groups with bib numbers.

## Features

- **CSV Import**: Upload files from eventry.net, HDComps.com, or any registration system
- **Auto-grouping**: Algorithm splits dancers into balanced age groups
- **Bib numbering**: Reverse-registration-order with customizable starting numbers
- **Privacy-first**: All processing happens locally; your data stays on your computer until you send it
- **Entries hand-off**: Receive paid dancers from ScotDance Entries, retaining the competition date, studio and destination.
- **Send to ScotDance.app**: ScotDance.app's own sheet opens over Splits (its `embed.js`): sign in and review the import. Lists from Entries already name their competition; manual uploads keep the picker.
- **Export ready**: Download a CSV for ScotDance.app or paper programs

## Development

- `npm run dev`: the app, sending to ScotDance.app Next
- `npm run dev:emulator`: sends to ScotDance's local web app instead (run its `npm run local` first); see `.env.emulator`
- `npm test`: Playwright e2e on `vite --mode e2e`, where the tests stand in for ScotDance.app's `embed.js`

Environment variables (optional, see `env.d.ts`):

- `VITE_SCOTDANCE_URL`: the ScotDance.app whose `embed.js` Send opens (default `https://next.scotdance.app`)
- `VITE_ENTRIES_ORIGIN`: an optional `http://localhost:PORT` or `http://127.0.0.1:PORT` Entries sender for development. Production accepts only `https://entries.scotdance.app`. Development also accepts both loopback hosts on port 5290.

For the complete local flow, run Entries on port 5290 and `npm run dev -- --port 5291` here. Point Entries at `http://localhost:5291`.

Analytics: Cloudflare Web Analytics (cookieless) is injected at the edge by the `scotdance.app` zone's automatic setup, route changes included, so there's no snippet here and none in dev.


## Entries message contract

Entries opens `https://splits.scotdance.app/?from=entries` as a popup and retains its window reference. Splits accepts messages only from that opener and an allowed Entries origin. No dancer data goes in the URL.

Every message has `channel: "scotdance:entries-splits"` and `version: 1`:

- Splits sends `type: "ready"` after installing its listener, repeating every 500 ms for up to 30 seconds so slow startup does not lose the handshake.
- Entries sends `type: "import"`, a unique `requestId`, `competitionId`, `date` (`YYYY-MM-DD`), `name`, and `text` (CSV).
- Splits replies `type: "imported"` with the request ID after loading, or `type: "error"` with the request ID and a message. Identical retries are acknowledged without replacing the work twice. A new user attempt needs a new request ID.

The CSV uses these exact columns: `First Name,Last Name,Category,Age,Town,Province,Country,Entered,Studio`. Empty optional cells must keep their places. Ages are integers 0–99; supported category names follow the ordinary Splits importer. The payload is limited to one million characters and 10,000 dancers. Entries is responsible for selecting active paid competitive participants and calculating their age; birthdays and parent contact details are not sent.

Existing work requires confirmation before replacement. The competition destination belongs to that in-memory dataset and clears on manual file replacement or reset. Sending to ScotDance passes it as optional `competitionId`; ScotDance still checks the signed-in organiser's access and keeps the usual import preview. Downloads now include explicit column headings, including Studio, for both separate and combined names.

## Deploy

The public Cloudflare worker is `scotdance-splits`, serving `splits.scotdance.app`. Its assets are entirely static; there is no server database or secret binding. The worker configuration records its existing account and domain. Deploy directly from the desired committed worktree:

```sh
npm run build
npm exec --yes --package wrangler@4.160.1 -- wrangler deploy --config wrangler.jsonc
```

Wrangler must already be authenticated to the `mismith` Cloudflare account. The matching ScotDance Next importer must be deployed first because exports include explicit Studio headers and an optional competition destination. The default embed comes from `https://next.scotdance.app`; the legacy app remains at `https://scotdance.app`.
