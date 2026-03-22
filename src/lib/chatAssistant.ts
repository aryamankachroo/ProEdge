export type ChatRole = 'user' | 'assistant'

export type ChatTurn = {
  role: ChatRole
  content: string
}

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

/**
 * Chat reply: either your backend (recommended: calls Gemini Flash server-side) or a local preview.
 *
 * Set `VITE_CHAT_API_URL` to your API origin (e.g. https://api.example.com). It should accept:
 *   POST /chat  { "messages": [{ "role": "user"|"assistant", "content": string }, ...] }
 * and return JSON: { "reply": string }
 *
 * Do not put Gemini API keys in the browser; proxy through your server.
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

  await sleep(400 + Math.random() * 500)
  const tip = MOCK_TIPS[Math.floor(Math.random() * MOCK_TIPS.length)]!
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  const hint = lastUser?.content?.trim()
  const short = hint
    ? ` You asked: “${hint.slice(0, 90)}${hint.length > 90 ? '…' : ''}”`
    : ''

  return `Preview assistant — ${tip}${short}\n\nWhen you’re ready, point VITE_CHAT_API_URL at an API that calls Gemini Flash and returns { reply }.`
}
