import { parse } from 'papaparse'
import { resolveCategoryCode } from './input'

export const ENTRIES_CHANNEL = 'scotdance:entries-splits'
export const ENTRIES_VERSION = 1
export const ENTRIES_ORIGIN = 'https://entries.scotdance.app'
const MAX_TEXT = 1_000_000
const HEADERS = [
  'First Name',
  'Last Name',
  'Category',
  'Age',
  'Town',
  'Province',
  'Country',
  'Entered',
  'Studio',
]

export interface EntriesImport {
  channel: typeof ENTRIES_CHANNEL
  version: typeof ENTRIES_VERSION
  type: 'import'
  requestId: string
  competitionId: string
  date: string
  name: string
  text: string
}

export function entriesOrigins(dev: boolean, override?: string): string[] {
  const origins = [ENTRIES_ORIGIN]
  if (!dev) return origins
  origins.push('http://localhost:5290', 'http://127.0.0.1:5290')
  if (override) {
    try {
      const url = new URL(override)
      if (
        url.origin === override &&
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname)
      )
        origins.push(override)
    } catch {
      /* An invalid development override never widens the allowlist. */
    }
  }
  return [...new Set(origins)]
}

/** Entries sends ages only, in a bounded, explicit CSV contract. Reject before replacing any work. */
export function readEntriesImport(value: unknown): EntriesImport {
  if (!value || typeof value !== 'object') throw new Error('The entry list is missing.')
  const v = value as Record<string, unknown>
  if (v.channel !== ENTRIES_CHANNEL || v.version !== ENTRIES_VERSION || v.type !== 'import')
    throw new Error(
      'This version of the entry list is not supported. Reload Entries and try again.',
    )
  const id = (s: unknown): s is string => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,200}$/.test(s)
  if (!id(v.requestId) || !id(v.competitionId))
    throw new Error('The competition or request is missing.')
  if (
    typeof v.date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(v.date) ||
    !Number.isFinite(Date.parse(v.date)) ||
    new Date(v.date).toISOString().slice(0, 10) !== v.date
  )
    throw new Error('The competition date is invalid.')
  if (typeof v.name !== 'string' || !v.name.trim() || v.name.length > 200)
    throw new Error('The entry list needs a name.')
  if (typeof v.text !== 'string' || !v.text.trim() || v.text.length > MAX_TEXT)
    throw new Error('The entry list is empty or too large. Download it from Entries instead.')
  const parsed = parse<string[]>(v.text, { skipEmptyLines: 'greedy' })
  const [headers, ...rows] = parsed.data
  if (
    parsed.errors.length ||
    !headers ||
    headers.length !== HEADERS.length ||
    !HEADERS.every((h, i) => headers[i]?.trim() === h)
  )
    throw new Error('The entry list columns are not recognised. Reload Entries and send it again.')
  if (
    !rows.length ||
    rows.length > 10_000 ||
    rows.some(
      (row) =>
        row.length !== HEADERS.length ||
        !row[0]?.trim() ||
        !resolveCategoryCode(row[2] || '') ||
        !/^\d{1,2}$/.test(row[3] || ''),
    )
  )
    throw new Error(
      'The entry list contains missing or invalid dancer details. Check it in Entries before sending it again.',
    )
  return {
    channel: ENTRIES_CHANNEL,
    version: ENTRIES_VERSION,
    type: 'import',
    requestId: v.requestId,
    competitionId: v.competitionId,
    date: v.date,
    name: v.name.trim(),
    text: v.text,
  }
}

interface ReceiverOptions {
  origins: string[]
  hasWork: () => boolean
  importEntries: (_payload: EntriesImport) => Promise<void>
  confirmReplace: () => boolean | Promise<boolean>
  onWaiting: (_waiting: boolean) => void
  onError: (_message: string) => void
}

/** A popup only trusts its opener, and only when that window is on an allowed Entries origin. */
export function listenForEntries(options: ReceiverOptions): () => void {
  const opener = window.opener as Window | null
  if (!opener) {
    options.onError('Open Splits using “Make age groups” in Entries, or choose a CSV file.')
    return () => {}
  }
  let busy = false
  let stopped = false
  let settled = false
  const completed = new Map<string, { payload: string; error?: string }>()
  const reply = (origin: string, type: string, requestId?: string, message?: string) => {
    if (!stopped && !opener.closed)
      opener.postMessage(
        {
          channel: ENTRIES_CHANNEL,
          version: ENTRIES_VERSION,
          type,
          ...(requestId ? { requestId } : {}),
          ...(message ? { message } : {}),
        },
        origin,
      )
  }
  const finishWaiting = () => {
    settled = true
    window.clearInterval(readyTimer)
    window.clearTimeout(timeout)
    options.onWaiting(false)
  }
  async function receive(event: MessageEvent) {
    if (
      event.source !== opener ||
      !options.origins.includes(event.origin) ||
      event.data?.channel !== ENTRIES_CHANNEL
    )
      return
    let payload: EntriesImport
    try {
      payload = readEntriesImport(event.data)
    } catch (error) {
      finishWaiting()
      const message = error instanceof Error ? error.message : 'Could not read the entry list.'
      options.onError(message)
      const requestId =
        typeof event.data?.requestId === 'string' && event.data.requestId.length <= 200
          ? event.data.requestId
          : undefined
      reply(event.origin, 'error', requestId, message)
      return
    }
    const fingerprint = JSON.stringify(payload)
    const previous = completed.get(payload.requestId)
    if (previous) {
      if (previous.payload !== fingerprint)
        reply(
          event.origin,
          'error',
          payload.requestId,
          'That request already contained a different entry list. Send it again from Entries.',
        )
      else
        reply(
          event.origin,
          previous.error ? 'error' : 'imported',
          payload.requestId,
          previous.error,
        )
      return
    }
    if (busy) return // The sender may retry while the organiser confirms; never show a second prompt.
    busy = true
    finishWaiting()
    try {
      if (options.hasWork() && !(await options.confirmReplace()))
        throw new Error(
          'Your current splits were kept. Send the entries again when you are ready to replace them.',
        )
      await options.importEntries(payload)
      options.onError('')
      completed.set(payload.requestId, { payload: fingerprint })
      reply(event.origin, 'imported', payload.requestId)
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Could not load the entries. Try sending them again.'
      completed.set(payload.requestId, { payload: fingerprint, error: message })
      options.onError(message)
      reply(event.origin, 'error', payload.requestId, message)
    } finally {
      busy = false
      if (completed.size > 8) completed.delete(completed.keys().next().value!)
    }
  }
  window.addEventListener('message', receive)
  options.onWaiting(true)
  // A referrer is only used after allowlist validation. No list data goes in the URL.
  let origin = ENTRIES_ORIGIN
  try {
    const from = new URL(document.referrer).origin
    if (options.origins.includes(from)) origin = from
  } catch {
    /* Direct/open-without-referrer uses the matching development origin or production. */
  }
  if (!document.referrer && ['localhost', '127.0.0.1'].includes(location.hostname)) {
    origin = options.origins.find((o) => o.startsWith(`http://${location.hostname}:`)) ?? origin
  }
  const ready = () => {
    if (settled) return
    if (opener.closed) {
      finishWaiting()
      options.onError(
        'Entries was closed before its dancers arrived. Open it and send them again, or choose a CSV file.',
      )
    } else reply(origin, 'ready')
  }
  const readyTimer = window.setInterval(ready, 500)
  const timeout = window.setTimeout(() => {
    finishWaiting()
    options.onError(
      'The entries have not arrived. Return to Entries and try again, or choose a CSV file.',
    )
  }, 30_000)
  ready()
  return () => {
    stopped = true
    window.clearInterval(readyTimer)
    window.clearTimeout(timeout)
    window.removeEventListener('message', receive)
  }
}
