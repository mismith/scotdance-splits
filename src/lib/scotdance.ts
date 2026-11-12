// ScotDance.app: Send hands the finished list to ScotDance.app's own sheet. Its embed.js
// (loaded only when someone presses Send, so nothing leaves the browser before then) opens
// over Splits, signs in if needed, asks which competition, and puts the list in that
// competition's Import dancers. Splits draws none of it, so it always looks and works
// like ScotDance.app, and its sign-in is ScotDance.app's own.

export interface SendResult {
  sent: boolean
  competitionId?: string
  competitionName?: string
  /** That competition's Import dancers, with the list waiting in it. */
  url?: string
}

interface ScotDanceEmbed {
  send(_item: {
    source: string
    name: string
    text: string
    competitionId?: string
  }): Promise<SendResult>
}

declare global {
  interface Window {
    ScotDance?: ScotDanceEmbed
  }
}

const SCOTDANCE_URL = (import.meta.env.VITE_SCOTDANCE_URL || 'https://next.scotdance.app').replace(
  /\/+$/,
  '',
)

export function scotdanceUrl(path = '') {
  return `${SCOTDANCE_URL}${path}`
}

let loading: Promise<ScotDanceEmbed> | undefined

function loadEmbed(): Promise<ScotDanceEmbed> {
  loading ??= new Promise<ScotDanceEmbed>((resolve, reject) => {
    if (window.ScotDance) return resolve(window.ScotDance)
    const script = document.createElement('script')
    script.src = scotdanceUrl('/embed.js')
    script.async = true
    script.onload = () =>
      window.ScotDance ? resolve(window.ScotDance) : reject(new Error('No ScotDance embed'))
    script.onerror = () => {
      script.remove()
      reject(new Error('ScotDance embed failed to load'))
    }
    document.head.appendChild(script)
  }).catch((error) => {
    loading = undefined // let a retry load it again
    throw error
  })
  return loading
}

/**
 * Opens ScotDance.app over Splits to send the list; resolves when its sheet closes.
 * `onOpen` once ScotDance.app has taken over (it shows its own loading from there).
 */
export async function sendToScotDance(
  item: { name: string; text: string; competitionId?: string },
  { onOpen }: { onOpen?: () => void } = {},
) {
  const embed = await loadEmbed()
  const result = embed.send({ source: 'Splits', ...item })
  onOpen?.()
  return result
}
