import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import type { StudyCalendarEvent } from '../types/profile'

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function startOfGrid(viewYear: number, viewMonth: number): Date {
  const first = new Date(viewYear, viewMonth, 1)
  const start = new Date(first)
  start.setDate(1 - first.getDay())
  return start
}

function buildGrid(viewYear: number, viewMonth: number): { date: Date; inMonth: boolean }[] {
  const start = startOfGrid(viewYear, viewMonth)
  const cells: { date: Date; inMonth: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    cells.push({ date: d, inMonth: d.getMonth() === viewMonth })
  }
  return cells
}

function monthTitle(y: number, m: number): string {
  return new Date(y, m, 1).toLocaleString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

type Props = {
  events: StudyCalendarEvent[]
  onChange: (next: StudyCalendarEvent[]) => void
}

export function OnboardingMonthCalendar({ events, onChange }: Props) {
  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [dialogDate, setDialogDate] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const draftInputRef = useRef<HTMLInputElement>(null)

  const closeDialog = useCallback(() => {
    setDialogDate(null)
    setDraftTitle('')
  }, [])

  const openDialog = useCallback((iso: string) => {
    setDraftTitle('')
    setDialogDate(iso)
  }, [])

  const grid = useMemo(
    () => buildGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const byDate = useMemo(() => {
    const m = new Map<string, StudyCalendarEvent[]>()
    for (const e of events) {
      const list = m.get(e.date) ?? []
      list.push(e)
      m.set(e.date, list)
    }
    return m
  }, [events])

  useEffect(() => {
    if (!dialogDate) return
    const id = requestAnimationFrame(() => draftInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [dialogDate])

  useEffect(() => {
    if (!dialogDate) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogDate, closeDialog])

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else setViewMonth((m) => m - 1)
  }

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else setViewMonth((m) => m + 1)
  }

  const goToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  const dialogEvents = dialogDate ? (byDate.get(dialogDate) ?? []) : []

  const addTodo = () => {
    if (!dialogDate || !draftTitle.trim()) return
    onChange([
      ...events,
      { id: newId(), date: dialogDate, title: draftTitle.trim() },
    ])
    setDraftTitle('')
  }

  const removeTodo = (id: string) => {
    onChange(events.filter((e) => e.id !== id))
  }

  return (
    <div className="onboarding-month-calendar overflow-hidden rounded-2xl border border-[#e5ddd4] bg-white shadow-sm dark:border-[#454440] dark:bg-[#262523] dark:shadow-[0_8px_32px_-12px_rgba(0,0,0,0.4)]">
      <div className="onboarding-cal-toolbar flex items-center justify-between border-b border-[#ebe5dc] px-4 py-3 dark:border-[#3d3c38] sm:px-5">
        <h3 className="text-base font-bold text-[#1a1a1a] dark:text-[#f5f2ed] sm:text-lg">
          {monthTitle(viewYear, viewMonth)}
        </h3>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="onboarding-nav-back rounded-lg px-2 py-1.5 text-sm font-medium text-[#3d3835] hover:bg-black/[0.04] dark:text-[#e8e6e1] dark:hover:bg-white/[0.06]"
            aria-label="Previous month"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-[#d8d0c6] bg-white px-3 py-1.5 text-xs font-semibold text-[#3d3835] shadow-sm hover:bg-[#faf8f5] dark:border-[#5c5a56] dark:bg-[#353432] dark:text-[#f0ebe4] dark:hover:bg-[#454440] sm:text-sm"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="onboarding-nav-back rounded-lg px-2 py-1.5 text-sm font-medium text-[#3d3835] hover:bg-black/[0.04] dark:text-[#e8e6e1] dark:hover:bg-white/[0.06]"
            aria-label="Next month"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-[#ebe5dc] bg-[#faf9f7] dark:border-[#3d3c38] dark:bg-[#1f1e1c]">
        {WEEK.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-[11px] font-medium text-[#8a8580] dark:text-[#a89e94] sm:text-xs"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 bg-white dark:bg-[#262523]">
        {grid.map(({ date, inMonth }) => {
          const iso = toISODate(date)
          const dayEvents = byDate.get(iso) ?? []
          const isToday = isSameDay(date, today)

          return (
            <button
              key={iso}
              type="button"
              onClick={() => openDialog(iso)}
              className={`flex min-h-[4.5rem] flex-col border-b border-r border-[#ebe5dc] p-1 text-left transition hover:bg-[#f7f5f2] dark:border-[#3d3c38] dark:hover:bg-[#353432]/80 sm:min-h-[5.25rem] ${
                !inMonth ? 'bg-[#fafaf9] dark:bg-[#1c1b1a]' : ''
              }`}
            >
              <span
                className={`mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center self-end text-[11px] font-medium sm:h-7 sm:w-7 sm:text-xs ${
                  isToday
                    ? 'rounded-full bg-[#e53935] text-white'
                    : inMonth
                      ? 'text-[#1a1a1a] dark:text-[#f0ebe4]'
                      : 'text-[#b5aea5] dark:text-[#7a756d]'
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className="truncate rounded-md bg-[#ede9fe] px-1 py-0.5 pl-1 text-[9px] font-medium leading-tight text-[#5b21b6] dark:bg-[#3d2f5c] dark:text-[#ddd6fe] sm:text-[10px]"
                    title={ev.title}
                  >
                    {ev.title}
                  </span>
                ))}
                {dayEvents.length > 3 ? (
                  <span className="text-[9px] text-[#8a8580] dark:text-[#9a928a]">
                    +{dayEvents.length - 3} more
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
      </div>

      {dialogDate ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-4 backdrop-blur-[2px] dark:bg-black/50 sm:items-center"
          role="presentation"
          onClick={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cal-dialog-title"
            data-onboarding-cal-dialog
            className="w-full max-w-md rounded-2xl border border-white/60 bg-white/95 p-5 shadow-2xl backdrop-blur-xl dark:border-[#454440] dark:bg-[#2a2927]/98"
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              id="cal-dialog-title"
              className="mb-4 text-sm font-semibold text-[#3d3835] dark:text-[#f0ebe4]"
            >
              {new Date(`${dialogDate}T12:00:00`).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </h4>

            {dialogEvents.length > 0 ? (
              <ul className="mb-4 max-h-32 space-y-2 overflow-y-auto">
                {dialogEvents.map((ev) => (
                  <li
                    key={ev.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[#f5f3f0] px-3 py-2 text-sm text-[#2c2825] dark:bg-[#353432] dark:text-[#eae8e4]"
                  >
                    <span className="min-w-0 truncate">{ev.title}</span>
                    <button
                      type="button"
                      onClick={() => removeTodo(ev.id)}
                      className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[#b45309] hover:bg-[#fff7ed]"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <label htmlFor="cal-todo-draft" className="sr-only">
              New to-do
            </label>
            <input
              ref={draftInputRef}
              id="cal-todo-draft"
              className="onboarding-input mb-3"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Add to-do for this day…"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTodo()
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeDialog}
                className="onboarding-nav-back rounded-full px-4 py-2 text-sm font-semibold"
              >
                Done
              </button>
              <button
                type="button"
                onClick={addTodo}
                disabled={!draftTitle.trim()}
                className="onboarding-cal-add rounded-full px-4 py-2 text-sm font-semibold shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
