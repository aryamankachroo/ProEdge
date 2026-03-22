import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../context/useProfile'
import {
  CALENDAR_KIND_LABELS,
  CALENDAR_KIND_ORDER,
  CALENDAR_KIND_STYLES,
  effectiveTodoKind,
} from '../lib/calendarRecommendationMeta'
import {
  getSuggestedDailyTasks,
  suggestedTasksAreFromDiagnostic,
  suggestedTasksAreFromQuestionnaire,
} from '../lib/calendarSuggestedTasks'
import {
  generateCalendarTodosFromProfile,
  mergeGeminiTodosIntoProfile,
  studyDaysForGeminiSchedule,
} from '../lib/geminiCalendar'
import type { StudyDayTodo } from '../types/profile'

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const MAX_TODOS_PER_DAY = 6

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

function buildGrid(
  viewYear: number,
  viewMonth: number,
): { date: Date; inMonth: boolean }[] {
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
  return (
    globalThis.crypto?.randomUUID?.() ??
    `t-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
  )
}

const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function longDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

/** Remove template auto-fills before replacing with Gemini-generated tasks. */
function stripSuggestionFillTodos(todos: StudyDayTodo[]): StudyDayTodo[] {
  return todos.filter(
    (t) => t.fillSource !== 'diagnostic' && t.fillSource !== 'questionnaire',
  )
}

export function CalendarPage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useProfile()
  const todos = profile.studyDayTodos

  const today = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedIso, setSelectedIso] = useState(() => toISODate(today))
  const [draftTitle, setDraftTitle] = useState('')
  const [geminiLoading, setGeminiLoading] = useState(false)
  const [geminiError, setGeminiError] = useState<string | null>(null)

  const hasGeminiKey = Boolean(import.meta.env.VITE_GEMINI_API_KEY)

  const grid = useMemo(
    () => buildGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  )

  const byDate = useMemo(() => {
    const m = new Map<string, StudyDayTodo[]>()
    for (const t of todos) {
      const list = m.get(t.date) ?? []
      list.push(t)
      m.set(t.date, list)
    }
    return m
  }, [todos])

  const suggestedTasks = useMemo(
    () => getSuggestedDailyTasks(profile),
    [profile],
  )

  const fromDiagnostic = suggestedTasksAreFromDiagnostic(profile)
  const fromQuestionnaire = suggestedTasksAreFromQuestionnaire(profile)

  const geminiWeekdayHint = useMemo(() => {
    const days = studyDaysForGeminiSchedule(profile)
    return days.map((d) => WEEKDAY_ABBR[d] ?? '?').join(', ')
  }, [profile])

  /**
   * Without a Gemini key, pre-fill each empty in-month day with the static template.
   * With VITE_GEMINI_API_KEY, we skip this so the calendar stays diverse (Gemini or manual add).
   */
  useEffect(() => {
    if (hasGeminiKey) return

    const tasks = getSuggestedDailyTasks(profile)
    const monthDates = buildGrid(viewYear, viewMonth)
      .filter((c) => c.inMonth)
      .map((c) => toISODate(c.date))

    const hasTasksFor = new Set<string>()
    for (const t of profile.studyDayTodos) {
      hasTasksFor.add(t.date)
    }

    const fillSource =
      fromDiagnostic ? 'diagnostic'
      : fromQuestionnaire ? 'questionnaire'
      : undefined

    const additions: StudyDayTodo[] = []
    for (const iso of monthDates) {
      if (hasTasksFor.has(iso)) continue
      for (const s of tasks) {
        additions.push({
          id: newId(),
          date: iso,
          title: s.title,
          completed: false,
          kind: s.kind,
          ...(fillSource ? { fillSource } : {}),
        })
      }
    }

    if (additions.length === 0) return

    setProfile({
      studyDayTodos: [...profile.studyDayTodos, ...additions],
    })
  }, [hasGeminiKey, viewYear, viewMonth, profile, setProfile, fromDiagnostic, fromQuestionnaire])

  const geminiAutoStarted = useRef(false)
  useEffect(() => {
    if (!hasGeminiKey) return
    if (geminiAutoStarted.current) return
    const personalized =
      profile.weakSections.length > 0 || profile.diagnosticSummary != null
    if (!personalized) return
    if (profile.studyDayTodos.length > 0) return

    geminiAutoStarted.current = true
    let cancelled = false
    ;(async () => {
      try {
        const rows = await generateCalendarTodosFromProfile(profile, {
          viewYear,
          viewMonth,
        })
        if (cancelled) return
        setProfile((prev) => ({
          studyDayTodos: mergeGeminiTodosIntoProfile(prev.studyDayTodos, rows),
        }))
      } catch {
        geminiAutoStarted.current = false
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    hasGeminiKey,
    profile,
    profile.weakSections,
    profile.diagnosticSummary,
    profile.studyDayTodos.length,
    viewYear,
    viewMonth,
    setProfile,
  ])

  const selectedTodos = useMemo(
    () => todos.filter((t) => t.date === selectedIso),
    [todos, selectedIso],
  )

  const completedCount = selectedTodos.filter((t) => t.completed).length
  const totalSelected = selectedTodos.length

  const setTodos = (next: StudyDayTodo[]) => {
    setProfile({ studyDayTodos: next })
  }

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t,
      ),
    )
  }

  const removeTodo = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id))
  }

  const addTodo = () => {
    if (!draftTitle.trim() || selectedTodos.length >= MAX_TODOS_PER_DAY) return
    setTodos([
      ...todos,
      {
        id: newId(),
        date: selectedIso,
        title: draftTitle.trim(),
        completed: false,
        kind: 'general',
      },
    ])
    setDraftTitle('')
  }

  const addSuggestedTasks = () => {
    if (selectedTodos.length > 0) return
    const fillSource =
      fromDiagnostic ? 'diagnostic'
      : fromQuestionnaire ? 'questionnaire'
      : undefined
    const additions: StudyDayTodo[] = suggestedTasks.map((s) => ({
      id: newId(),
      date: selectedIso,
      title: s.title,
      completed: false,
      kind: s.kind,
      ...(fillSource ? { fillSource } : {}),
    }))
    setTodos([...todos, ...additions])
  }

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
    setSelectedIso(toISODate(today))
  }

  const handleGeminiCalendar = async () => {
    setGeminiError(null)
    setGeminiLoading(true)
    try {
      const base = stripSuggestionFillTodos(profile.studyDayTodos)
      const rows = await generateCalendarTodosFromProfile(profile, {
        viewYear,
        viewMonth,
      })
      const next = mergeGeminiTodosIntoProfile(base, rows)
      setProfile({ studyDayTodos: next })
    } catch (e) {
      setGeminiError(
        e instanceof Error ? e.message : 'Could not generate calendar tasks.',
      )
    } finally {
      setGeminiLoading(false)
    }
  }

  return (
    <div className="onboarding-shell min-h-dvh pb-16">
      <header className="sticky top-0 z-10 border-b border-[#e8dfd4]/80 bg-[#faf7f3]/90 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link
            to="/"
            className="text-lg font-bold tracking-tight text-[#1a1816] no-underline hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5f7f6a] focus-visible:ring-offset-2 focus-visible:ring-offset-[#faf7f3] rounded-sm"
            aria-label="ProEdge home"
          >
            ProEdge
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-[#5f7f6a]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="shell-nav-btn"
            >
              Dashboard
            </button>
            <span className="shell-nav-btn-active">Calendar</span>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="shell-nav-btn"
            >
              AI analytics
            </button>
            <button
              type="button"
              onClick={() => navigate('/journal')}
              className="shell-nav-btn"
            >
              AI journal
            </button>
            <button
              type="button"
              onClick={() => navigate('/study-plan')}
              className="shell-nav-btn"
            >
              Study plan
            </button>
            <button
              type="button"
              onClick={() => navigate('/diagnostics/test')}
              className="shell-nav-btn"
            >
              Retake diagnostic
            </button>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] sm:text-4xl">
          Study calendar
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7a6e66] sm:text-base">
          Pick a day and check tasks off. With{' '}
          <strong className="font-semibold text-[#5a4f47]">Gemini</strong>, daily
          tasks are generated from your questionnaire and (if you took it) your
          mini-diagnostic — different topics each day. Without a key, the app uses a
          simple repeated template instead.
        </p>
        {hasGeminiKey ? (
          <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#9a8b7e]">
            Gemini only adds tasks on{' '}
            <span className="font-medium text-[#6b5f56]">{geminiWeekdayHint}</span>
            {profile.studyDays.length === 1 ? (
              <>
                {' '}
                (you only chose one study day in onboarding, so we use Mon–Fri for
                the plan).
              </>
            ) : (
              <>
                {' '}
                (from your study-day settings). Other days stay empty unless you add
                tasks manually.
              </>
            )}
          </p>
        ) : null}

        <div className="mt-5 max-w-3xl rounded-2xl border border-[#ebe5dc] bg-[#faf9f7] px-4 py-3 sm:px-5">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[#9a8b7e]">
            Recommendation types
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CALENDAR_KIND_ORDER.map((k) => (
              <span
                key={k}
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${CALENDAR_KIND_STYLES[k].badge}`}
              >
                {CALENDAR_KIND_LABELS[k]}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-6 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={handleGeminiCalendar}
            disabled={geminiLoading || !hasGeminiKey}
            className="inline-flex items-center justify-center rounded-full bg-[#1a73e8] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1557b0] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {geminiLoading
              ? 'Generating with Gemini…'
              : 'Generate / refresh plan with Gemini (questionnaire + diagnostic)'}
          </button>
          {!hasGeminiKey ? (
            <p className="text-xs leading-relaxed text-[#9a8b7e]">
              Add{' '}
              <code className="rounded bg-[#ebe5dc] px-1 py-0.5 text-[11px]">
                VITE_GEMINI_API_KEY
              </code>{' '}
              to <code className="rounded bg-[#ebe5dc] px-1 py-0.5 text-[11px]">.env.local</code> in
              ProEdge, then restart <code className="rounded bg-[#ebe5dc] px-1 py-0.5 text-[11px]">npm run dev</code>.
              Keys in the frontend are visible in the browser — use for local demos only.
            </p>
          ) : null}
        </div>
        {geminiError ? (
          <p className="mt-3 max-w-2xl rounded-xl bg-[#fff0ee] px-4 py-3 text-sm text-[#9d4e36]">
            {geminiError}
          </p>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_minmax(280px,380px)] lg:items-start">
          <div className="overflow-hidden rounded-2xl border border-[#e5ddd4] bg-white shadow-[0_12px_40px_-16px_rgba(90,70,55,0.12)]">
            <div className="flex items-center justify-between border-b border-[#ebe5dc] px-4 py-3 sm:px-5">
              <h2 className="text-base font-bold text-[#1a1a1a] sm:text-lg">
                {monthTitle(viewYear, viewMonth)}
              </h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={goPrev}
                  className="onboarding-nav-back rounded-lg px-2 py-1.5 text-sm font-medium text-[#3d3835] hover:bg-black/[0.04]"
                  aria-label="Previous month"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goToday}
                  className="rounded-lg border border-[#d8d0c6] bg-white px-3 py-1.5 text-xs font-semibold text-[#3d3835] shadow-sm hover:bg-[#faf8f5] sm:text-sm"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="onboarding-nav-back rounded-lg px-2 py-1.5 text-sm font-medium text-[#3d3835] hover:bg-black/[0.04]"
                  aria-label="Next month"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-[#ebe5dc] bg-[#faf9f7]">
              {WEEK.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[11px] font-medium text-[#8a8580] sm:text-xs"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 bg-white">
              {grid.map(({ date, inMonth }) => {
                const iso = toISODate(date)
                const dayTodos = byDate.get(iso) ?? []
                const isToday = isSameDay(date, today)
                const selected = iso === selectedIso
                const done = dayTodos.filter((t) => t.completed).length
                const total = dayTodos.length

                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedIso(iso)}
                    className={`flex min-h-[4.5rem] flex-col border-b border-r border-[#ebe5dc] p-1.5 text-left transition sm:min-h-[5.25rem] ${
                      selected
                        ? 'bg-[#f0f6f2] ring-1 ring-inset ring-[#5f7f6a]/35'
                        : 'hover:bg-[#f7f5f2]'
                    } ${!inMonth ? 'bg-[#fafaf9]' : ''}`}
                  >
                    <span
                      className={`mb-1 flex h-6 w-6 shrink-0 items-center justify-center self-end text-[11px] font-medium sm:h-7 sm:w-7 sm:text-xs ${
                        isToday
                          ? 'rounded-full bg-[#e53935] text-white'
                          : inMonth
                            ? 'text-[#1a1a1a]'
                            : 'text-[#b5aea5]'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {total > 0 ? (
                      <div className="mt-auto flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
                        <div className="flex min-h-0 flex-1 flex-col gap-0.5">
                          {dayTodos.slice(0, 2).map((t) => {
                            const k = effectiveTodoKind(t)
                            const st = CALENDAR_KIND_STYLES[k]
                            return (
                              <span
                                key={t.id}
                                title={`${CALENDAR_KIND_LABELS[k]}: ${t.title}`}
                                className={`flex min-h-0 items-center gap-0.5 truncate rounded-md py-0.5 pl-0.5 pr-0.5 text-[8px] font-medium leading-tight sm:text-[9px] ${
                                  t.completed
                                    ? 'bg-[#cfe5d6] text-[#1e3d2a] line-through decoration-[#5f7f6a]/60'
                                    : `${st.badge} text-[#1a1816] ring-1 ring-inset ring-black/[0.06]`
                                }`}
                              >
                                {!t.completed ? (
                                  <span
                                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${st.dot}`}
                                    aria-hidden
                                  />
                                ) : null}
                                <span className="min-w-0 truncate">{t.title}</span>
                              </span>
                            )
                          })}
                          {total > 2 ? (
                            <span className="text-[8px] text-[#8a8580] sm:text-[9px]">
                              +{total - 2} more
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[10px] font-medium text-[#5f7f6a] sm:text-[11px]">
                          {done}/{total} done
                        </span>
                        <div className="h-1 overflow-hidden rounded-full bg-[#e8dfd4]">
                          <div
                            className="h-full rounded-full bg-[#5f7f6a] transition-[width]"
                            style={{
                              width: `${total ? (done / total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="mt-auto text-[9px] text-[#c4bbb2] sm:text-[10px]">
                        Tap to plan
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="rounded-2xl border border-[#e5ddd4] bg-white/90 p-5 shadow-[0_12px_40px_-16px_rgba(90,70,55,0.12)] backdrop-blur-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9a8b7e]">
              Day detail
            </p>
            <h3 className="onboarding-serif mt-2 text-xl font-semibold text-[#2c2825]">
              {longDateLabel(selectedIso)}
            </h3>
            {totalSelected > 0 ? (
              <p className="mt-1 text-sm text-[#5f7f6a]">
                {completedCount} of {totalSelected} complete
              </p>
            ) : (
              <div className="mt-1 space-y-1 text-sm text-[#7a6e66]">
                <p>
                  No tasks yet — add six suggested tasks or type your own.
                </p>
                {fromDiagnostic ? (
                  <p className="text-xs text-[#9a8b7e]">
                    Suggestions use your latest mini-diagnostic (client-side
                    dummy plan until the server is live).
                  </p>
                ) : fromQuestionnaire ? (
                  <p className="text-xs text-[#9a8b7e]">
                    Six task types per day (weak sections, CARS, Anki, resources,
                    etc.) follow your questionnaire answers.
                  </p>
                ) : (
                  <p className="text-xs text-[#9a8b7e]">
                    Generic study-day template — take the diagnostic or finish the
                    questionnaire for tailored suggestions.
                  </p>
                )}
              </div>
            )}

            <ul className="mt-5 space-y-2">
              {selectedTodos.map((t) => (
                <li
                  key={t.id}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 transition ${
                    t.completed
                      ? 'border-[#cfe5d6] bg-[#f4faf6]'
                      : 'border-[#ebe5dc] bg-[#faf9f7]'
                  }`}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={t.completed}
                    onClick={() => toggleTodo(t.id)}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      t.completed
                        ? 'border-[#5f7f6a] bg-[#5f7f6a] text-white'
                        : 'border-[#c9bfb4] bg-white hover:border-[#5f7f6a]/50'
                    }`}
                  >
                    {t.completed ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        aria-hidden
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    ) : null}
                  </button>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`mb-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${CALENDAR_KIND_STYLES[effectiveTodoKind(t)].badge}`}
                    >
                      {CALENDAR_KIND_LABELS[effectiveTodoKind(t)]}
                    </span>
                    <p
                      className={`text-sm leading-snug ${
                        t.completed
                          ? 'text-[#6b7f6f] line-through'
                          : 'text-[#2c2825]'
                      }`}
                    >
                      {t.title}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTodo(t.id)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-[#9a8b7e] hover:bg-[#f5f0eb] hover:text-[#b45309]"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            {selectedTodos.length === 0 ? (
              <button
                type="button"
                onClick={addSuggestedTasks}
                className="mt-5 w-full rounded-xl border border-[#5f7f6a]/40 bg-[#f0f6f2] py-3 text-sm font-semibold text-[#2d4a32] transition hover:bg-[#e4efe6]"
              >
                {fromDiagnostic
                  ? 'Add suggested tasks from diagnostic (6)'
                  : fromQuestionnaire
                    ? 'Add suggested tasks from questionnaire (6)'
                    : 'Add sample study day (6 tasks)'}
              </button>
            ) : null}

            <div className="mt-5 border-t border-[#ebe5dc] pt-5">
              <label htmlFor="cal-new-todo" className="sr-only">
                New task
              </label>
              <input
                id="cal-new-todo"
                className="onboarding-input mb-3"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Add a task…"
                disabled={selectedTodos.length >= MAX_TODOS_PER_DAY}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTodo()
                  }
                }}
              />
              <button
                type="button"
                onClick={addTodo}
                disabled={
                  !draftTitle.trim() ||
                  selectedTodos.length >= MAX_TODOS_PER_DAY
                }
                className="onboarding-nav-next w-full rounded-full bg-[#5f7f6a] py-2.5 text-sm font-semibold shadow-sm transition hover:bg-[#536b5d] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add task ({selectedTodos.length}/{MAX_TODOS_PER_DAY})
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
