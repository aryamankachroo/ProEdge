import type { AiJournalEntry, JournalMode } from '../types/journal'
import type { StudyDayTodo } from '../types/profile'

function startOfLocalDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(aIso: string, bIso: string) {
  const a = startOfLocalDay(new Date(`${aIso}T12:00:00`))
  const b = startOfLocalDay(new Date(`${bIso}T12:00:00`))
  return Math.round((b - a) / 86_400_000)
}

function lastEntryByMode(entries: AiJournalEntry[], mode: JournalMode) {
  const subset = entries.filter((e) => e.mode === mode)
  if (subset.length === 0) return null
  return subset.reduce((a, b) =>
    new Date(a.createdAt) > new Date(b.createdAt) ? a : b,
  )
}

function todosForDate(todos: StudyDayTodo[], date: string) {
  return todos.filter((t) => t.date === date)
}

/**
 * Suggests a journal mode from calendar + history. Students can always pick another.
 */
export function suggestJournalModeContext(
  entries: AiJournalEntry[],
  todos: StudyDayTodo[],
): { mode: JournalMode; reason: string } {
  const ymd = todayYmd()
  const now = new Date()
  const hour = now.getHours()

  const lastWeekly = lastEntryByMode(entries, 'weekly-reflection')
  if (lastWeekly) {
    const d = daysBetween(
      lastWeekly.createdAt.slice(0, 10),
      ymd,
    )
    if (d >= 7) {
      return {
        mode: 'weekly-reflection',
        reason:
          'It’s been a week since your last weekly reflection — good moment to zoom out without judging the week.',
      }
    }
  } else if (entries.length >= 3) {
    return {
      mode: 'weekly-reflection',
      reason:
        'You’ve journaled a few times; a short weekly reflection can connect dots across days.',
    }
  }

  const todayTodos = todosForDate(todos, ymd)
  const completedToday = todayTodos.filter((t) => t.completed).length
  const totalToday = todayTodos.length
  const hadStudyToday = totalToday > 0 && completedToday > 0

  if (hadStudyToday && hour >= 14) {
    return {
      mode: 'session-debrief',
      reason:
        'You checked off study tasks today — a structured debrief closes the loop on how it actually felt.',
    }
  }

  if (totalToday > 0 && completedToday === 0 && hour >= 16) {
    return {
      mode: 'brain-dump',
      reason:
        'Planned tasks are still open today — if something feels off, a brain dump is the lightest way to name it.',
    }
  }

  const recentRough = [...entries]
    .filter((e) => e.dayQuality === 'rough' || e.feltTerrible)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
  if (recentRough) {
    const days = daysBetween(recentRough.createdAt.slice(0, 10), ymd)
    if (days <= 2) {
      return {
        mode: 'brain-dump',
        reason:
          'You recently logged a rough day — venting freely can sit next to prep without fixing anything yet.',
      }
    }
  }

  if (entries.length === 0) {
    return {
      mode: 'session-debrief',
      reason:
        'Start with a short debrief so future entries can track the same signals you care about.',
    }
  }

  return {
    mode: 'brain-dump',
    reason:
      'When nothing specific triggered this screen, a quick brain dump keeps the channel open.',
  }
}
