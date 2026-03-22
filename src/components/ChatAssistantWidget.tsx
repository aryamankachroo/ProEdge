import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import ReactMarkdown from 'react-markdown'
import {
  isGeminiChatAvailable,
  isRemoteChatApiConfigured,
  requestChatReply,
  type ChatTurn,
} from '../lib/chatAssistant'
import { useProfile } from '../context/useProfile'

type Row = ChatTurn & { id: string }

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `m-${Date.now()}`
}

/** Gemini sometimes returns `\**bold**` — strip stray backslashes before markdown punctuation. */
function normalizeAssistantMarkdown(raw: string): string {
  return raw.replace(/\\([*#`])/g, '$1')
}

function ChatBubbleContent({
  role,
  content,
}: {
  role: 'user' | 'assistant'
  content: string
}) {
  if (role === 'user') {
    return <p className="whitespace-pre-wrap break-words">{content}</p>
  }
  return (
    <div className="max-w-full text-sm leading-snug text-[#3d3835] [&_a]:text-[#2563eb] [&_a]:underline">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="mb-2 last:mb-0 whitespace-pre-wrap">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-2 list-disc space-y-1 pl-4 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2 list-decimal space-y-1 pl-4 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-snug">{children}</li>,
          strong: ({ children }) => (
            <strong className="font-semibold text-[#2c2825]">{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          h1: ({ children }) => (
            <p className="mb-2 font-semibold text-[#2c2825]">{children}</p>
          ),
          h2: ({ children }) => (
            <p className="mb-2 font-semibold text-[#2c2825]">{children}</p>
          ),
          h3: ({ children }) => (
            <p className="mb-1.5 font-semibold">{children}</p>
          ),
          code: ({ children }) => (
            <code className="rounded bg-[#f5f0eb] px-1 py-0.5 font-mono text-[0.85em] text-[#2c2825]">
              {children}
            </code>
          ),
        }}
      >
        {normalizeAssistantMarkdown(content)}
      </ReactMarkdown>
    </div>
  )
}

export function ChatAssistantWidget() {
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const geminiLive = isGeminiChatAvailable() || isRemoteChatApiConfigured()
  const [rows, setRows] = useState<Row[]>(() => [
    {
      id: newId(),
      role: 'assistant',
      content:
        profile.name.trim()
          ? `Hi ${profile.name.trim().split(/\s+/)[0]} — I’m your study assistant. Ask about pacing, review, or MCAT sections.${geminiLive ? '' : ' (Add VITE_GEMINI_API_KEY in .env.local to chat with Gemini.)'}`
          : `Hi — I’m your study assistant. Ask about pacing, review, or MCAT sections.${geminiLive ? '' : ' (Add VITE_GEMINI_API_KEY in .env.local to chat with Gemini.)'}`,
    },
  ])

  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!open) return
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [rows, open, loading])

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(t)
    }
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setError(null)
    const userRow: Row = { id: newId(), role: 'user', content: text }
    setRows((r) => [...r, userRow])
    setLoading(true)
    try {
      const history: ChatTurn[] = [...rows, userRow].map(({ role, content }) => ({
        role,
        content,
      }))
      const reply = await requestChatReply(history)
      setRows((r) => [...r, { id: newId(), role: 'assistant', content: reply }])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
      setRows((r) => [
        ...r,
        {
          id: newId(),
          role: 'assistant',
          content:
            'Could not get a reply. Check VITE_GEMINI_API_KEY in .env.local, your network, or VITE_CHAT_API_URL if you use a custom server.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[10000] p-4 sm:p-5">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {open ? (
          <div
            className="flex w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-2xl border border-[#e5ddd4] bg-[#faf7f3] shadow-[0_20px_50px_-12px_rgba(44,40,37,0.35)]"
            role="dialog"
            aria-label="Study assistant chat"
          >
            <div className="flex items-center justify-between border-b border-[#ebe5dc] bg-white/90 px-3 py-2.5">
              <div>
                <p className="text-sm font-bold text-[#2c2825]">Study assistant</p>
                <p className="text-[10px] text-[#7a6e66]">
                  {geminiLive ? 'Gemini Flash' : 'Preview — add VITE_GEMINI_API_KEY'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 text-sm font-semibold text-[#6b5e54] hover:bg-[#f5f0eb]"
                aria-label="Close chat"
              >
                ✕
              </button>
            </div>

            <div
              ref={listRef}
              className="max-h-[min(52dvh,22rem)] space-y-3 overflow-y-auto px-3 py-3"
              aria-live="polite"
            >
              {rows.map((row) => (
                <div
                  key={row.id}
                  className={`flex ${row.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-snug ${
                      row.role === 'user'
                        ? 'bg-[#5f7f6a] text-white'
                        : 'border border-[#ebe5dc] bg-white text-[#3d3835]'
                    }`}
                  >
                    <ChatBubbleContent role={row.role} content={row.content} />
                  </div>
                </div>
              ))}
              {loading ? (
                <p className="text-xs italic text-[#9a8b7e]">Thinking…</p>
              ) : null}
              {error ? (
                <p className="text-xs text-[#b91c1c]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="border-t border-[#ebe5dc] bg-white/95 p-2">
              <textarea
                ref={inputRef}
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask about study strategy…"
                className="w-full resize-none rounded-xl border border-[#e8dfd4] bg-[#fffefb] px-3 py-2 text-sm text-[#2c2825] placeholder:text-[#a8988c] focus:border-[#5f7f6a] focus:outline-none focus:ring-1 focus:ring-[#5f7f6a]/30"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="mt-2 w-full rounded-xl bg-[#2c2825] py-2 text-sm font-semibold text-white transition hover:bg-[#1f1c1a] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Send
              </button>
              <p className="mt-2 px-1 text-[10px] leading-relaxed text-[#9a8b7e]">
                {geminiLive ? (
                  <>
                    Using Gemini. Optional: set{' '}
                    <code className="rounded bg-[#f5f0eb] px-0.5">VITE_CHAT_API_URL</code> for a
                    server-side POST /chat instead.
                  </>
                ) : (
                  <>
                    Add <code className="rounded bg-[#f5f0eb] px-0.5">VITE_GEMINI_API_KEY</code> to{' '}
                    <code className="rounded bg-[#f5f0eb] px-0.5">.env.local</code> and restart{' '}
                    <code className="rounded bg-[#f5f0eb] px-0.5">npm run dev</code>.
                  </>
                )}
              </p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#5f7f6a] text-white shadow-[0_10px_30px_-8px_rgba(95,127,106,0.65)] transition hover:bg-[#536b5d]"
          aria-label={open ? 'Close study assistant' : 'Open study assistant'}
          aria-expanded={open}
        >
          {open ? (
            <span className="text-xl leading-none">↓</span>
          ) : (
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
