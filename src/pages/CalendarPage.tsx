import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useProfile } from '../context/useProfile'
import {
  getSuggestedDailyTaskTitles,
  suggestedTasksAreFromDiagnostic,
  suggestedTasksAreFromQuestionnaire,
} from '../lib/calendarSuggestedTasks'
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

function longDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
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

  const suggestedTitles = useMemo(
    () => getSuggestedDailyTaskTitles(profile),
    [profile],
  )

  const fromDiagnostic = suggestedTasksAreFromDiagnostic(profile)
  const fromQuestionnaire = suggestedTasksAreFromQuestionnaire(profile)

  /** Pre-fill each in-month day with suggested tasks so the grid shows real items (dummy until backend). */
  useEffect(() => {
    const titles = getSuggestedDailyTaskTitles(profile)
    const monthDates = buildGrid(viewYear, viewMonth)
      .filter((c) => c.inMonth)
      .map((c) => toISODate(c.date))

    const hasTasksFor = new Set<string>()
    for (const t of profile.studyDayTodos) {
      hasTasksFor.add(t.date)
    }

    const additions: StudyDayTodo[] = []
    for (const iso of monthDates) {
      if (hasTasksFor.has(iso)) continue
      for (const title of titles) {
        additions.push({
          id: newId(),
          date: iso,
          title,
          completed: false,
        })
      }
    }

    if (additions.length === 0) return

    setProfile({
      studyDayTodos: [...profile.studyDayTodos, ...additions],
    })
  }, [viewYear, viewMonth, profile, setProfile])

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
      },
    ])
    setDraftTitle('')
  }

  const addSuggestedTasks = () => {
    if (selectedTodos.length > 0) return
    const additions: StudyDayTodo[] = suggestedTitles.map((title) => ({
      id: newId(),
      date: selectedIso,
      title,
      completed: false,
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

  return (
    <div className="onboarding-shell min-h-dvh pb-16">
      <header className="sticky top-0 z-10 border-b border-[#e8dfd4]/80 bg-[#faf7f3]/90 px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <span className="text-lg font-bold tracking-tight text-[#1a1816]">
            ProEdge
          </span>
          <nav className="flex flex-wrap items-center justify-end gap-3 text-sm font-semibold text-[#5f7f6a]">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="hover:text-[#2c2825]"
            >
              Dashboard
            </button>
            <span className="text-[#2c2825]">Calendar</span>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="hover:text-[#2c2825]"
            >
              AI analytics
            </button>
            <button
              type="button"
              onClick={() => navigate('/study-plan')}
              className="hover:text-[#2c2825]"
            >
              Study plan
            </button>
            <button
              type="button"
              onClick={() => navigate('/diagnostics/test')}
              className="hover:text-[#2c2825]"
            >
              Retake diagnostic
            </button>
            <Link to="/" className="hover:text-[#2c2825]">
              Home
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] sm:text-4xl">
          Study calendar
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7a6e66] sm:text-base">
          Pick a day and add suggested tasks from your diagnostic (or
          questionnaire weak sections) — placeholder copy until the backend
          syncs real plans. Check items off as you go.
        </p>

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
                          {dayTodos.slice(0, 2).map((t) => (
                            <span
                              key={t.id}
                              title={t.title}
                              className={`truncate rounded-md px-1 py-0.5 pl-1 text-[8px] font-medium leading-tight sm:text-[9px] ${
                                t.completed
                                  ? 'bg-[#cfe5d6] text-[#1e3d2a] line-through decoration-[#5f7f6a]/60'
                                  : 'bg-[#ede9fe] text-[#5b21b6]'
                              }`}
                            >
                              {t.title}
                            </span>
                          ))}
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
                    Suggestions reference sections you marked shaky in the
                    questionnaire (placeholder wording).
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
                  <span
                    className={`min-w-0 flex-1 text-sm leading-snug ${
                      t.completed
                        ? 'text-[#6b7f6f] line-through'
                        : 'text-[#2c2825]'
                    }`}
                  >
                    {t.title}
                  </span>
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
