import { GoogleGenerativeAI } from '@google/generative-ai'

export type ChatRole = 'user' | 'assistant'

export type ChatTurn = {
  role: ChatRole
  content: string
}

const MODEL = 'gemini-2.5-flash'

const MOCK_TIPS = [
  'Try 25–50 minute focus blocks with a 5-minute reset — easier to repeat daily than rare marathons.',
  'After practice, spend most of your review on why wrong answers felt tempting, not only the correct fact.',
  'Alternate CARS with a science block so test day doesn’t feel like “mode switching” for the first time.',
  'Tag Anki cards by trap type (careless vs content gap) so drills match what actually broke.',
  'One full-length every 1–2 weeks beats cramming three the week before — keep stamina honest.',
]

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/** True when Gemini can run in the browser (same key as calendar; demo-only — key is in the bundle). */
export function isGeminiChatAvailable(): boolean {
  return Boolean(import.meta.env.VITE_GEMINI_API_KEY?.trim())
}

/** True when a custom server handles chat (keys stay on the server). */
export function isRemoteChatApiConfigured(): boolean {
  return Boolean(import.meta.env.VITE_CHAT_API_URL?.trim())
}

async function requestGeminiClientReply(messages: ChatTurn[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim()
  if (!apiKey) throw new Error('Missing VITE_GEMINI_API_KEY')

  let welcome = ''
  let rest = messages
  if (messages[0]?.role === 'assistant') {
    welcome = messages[0].content
    rest = messages.slice(1)
  }

  const last = rest[rest.length - 1]
  if (!last || last.role !== 'user') {
    throw new Error('Expected the latest message to be from the user')
  }

  const systemInstruction =
    `You are a concise, supportive MCAT study coach. Give practical, evidence-aligned advice (pacing, CARS, sciences, review, test day). ` +
    `Keep answers focused (roughly 2–6 short paragraphs unless the student asks for detail). ` +
    (welcome ? `You opened with this greeting (stay consistent in tone): ${welcome}` : '')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction,
  })

  const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
  for (let i = 0; i < rest.length - 1; i += 2) {
    const u = rest[i]
    const a = rest[i + 1]
    if (!u || !a || u.role !== 'user' || a.role !== 'assistant') {
      throw new Error('Invalid alternating user/assistant history')
    }
    history.push({ role: 'user', parts: [{ text: u.content }] })
    history.push({ role: 'model', parts: [{ text: a.content }] })
  }

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(last.content)
  const text = result.response.text()
  if (!text?.trim()) throw new Error('Empty reply from Gemini')
  return text.trim()
}

/**
 * Chat reply priority:
 * 1. `VITE_CHAT_API_URL` + POST `/chat` (server holds the key; production-friendly).
 * 2. `VITE_GEMINI_API_KEY` — Gemini Flash in the browser (same pattern as calendar; demo/local only).
 * 3. Local preview text if neither is set.
 */
export async function requestChatReply(messages: ChatTurn[]): Promise<string> {
  const base = import.meta.env.VITE_CHAT_API_URL?.trim()

  if (base) {
    const url = `${base.replace(/\/$/, '')}/chat`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      throw new Error(t || `Chat failed (${res.status})`)
    }
    const data = (await res.json()) as { reply?: string }
    if (typeof data.reply !== 'string' || !data.reply.trim()) {
      throw new Error('Bad reply from chat API')
    }
    return data.reply.trim()
  }

  if (isGeminiChatAvailable()) {
    return requestGeminiClientReply(messages)
  }

  await sleep(400 + Math.random() * 500)
  const tip = MOCK_TIPS[Math.floor(Math.random() * MOCK_TIPS.length)]!
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const hint = lastUser?.content?.trim()
  const short = hint
    ? ` You asked: “${hint.slice(0, 90)}${hint.length > 90 ? '…' : ''}”`
    : ''

  return `Preview assistant — ${tip}${short}\n\nAdd VITE_GEMINI_API_KEY to .env.local (see .env.example), or set VITE_CHAT_API_URL to a server that implements POST /chat with Gemini.`
}
