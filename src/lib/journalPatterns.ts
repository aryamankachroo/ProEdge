import type { AiJournalEntry } from '../types/journal'
import type { StudyDayTodo } from '../types/profile'
import type { AiAnalyticsSnapshot } from '../types/analytics'
import { signalById } from './burnoutSignals'

function labelForSignalId(id: string): string {
  return signalById(id)?.label ?? id
}

/** Dates (yyyy-mm-dd) in the last `withinDays` from today */
function recentDates(withinDays: number): Set<string> {
  const set = new Set<string>()
  const t = new Date()
  for (let i = 0; i < withinDays; i++) {
    const d = new Date(t)
    d.setDate(d.getDate() - i)
    set.add(d.toISOString().slice(0, 10))
  }
  return set
}

function entryDate(e: AiJournalEntry) {
  return e.createdAt.slice(0, 10)
}

/**
 * Days with at least one todo and zero completions (skipped study pattern from calendar).
 */
export function skippedStudyDatesFromCalendar(
  todos: StudyDayTodo[],
  withinDays: number,
): string[] {
  const recent = recentDates(withinDays)
  const byDate = new Map<string, StudyDayTodo[]>()
  for (const t of todos) {
    if (!recent.has(t.date)) continue
    if (!byDate.has(t.date)) byDate.set(t.date, [])
    byDate.get(t.date)!.push(t)
  }
  const out: string[] = []
  for (const [date, list] of byDate) {
    if (list.length === 0) continue
    if (list.every((x) => !x.completed)) out.push(date)
  }
  return [...out].sort()
}

function roughEntryDates(entries: AiJournalEntry[], withinDays: number): string[] {
  const recent = recentDates(withinDays)
  const set = new Set<string>()
  for (const e of entries) {
    const d = entryDate(e)
    if (!recent.has(d)) continue
    if (e.dayQuality === 'rough' || e.feltTerrible) set.add(d)
  }
  return [...set].sort()
}

function signalsInWindow(
  entries: AiJournalEntry[],
  centerYmd: string,
  daysBefore: number,
): Map<string, number> {
  const center = new Date(`${centerYmd}T12:00:00`).getTime()
  const start = center - daysBefore * 86_400_000
  const counts = new Map<string, number>()
  for (const e of entries) {
    const t = new Date(e.createdAt).getTime()
    if (t >= start && t <= center) {
      for (const id of e.activeSignalIds) {
        counts.set(id, (counts.get(id) ?? 0) + 1)
      }
    }
  }
  return counts
}

/**
 * Data-backed copy only — no invented “burnout score.”
 */
export function buildJournalPatternInsights(
  entries: AiJournalEntry[],
  todos: StudyDayTodo[],
  lastAnalytics: AiAnalyticsSnapshot | null,
  withinDays = 30,
): string[] {
  const insights: string[] = []
  const recent = entries.filter((e) =>
    recentDates(withinDays).has(entryDate(e)),
  )

  if (recent.length === 0 && entries.length === 0) {
    return [
      'Once you save a few journal entries, we’ll surface patterns here from your own signals and calendar — not a score, just what tended to show up together.',
    ]
  }

  const roughDays = roughEntryDates(entries, withinDays)
  if (roughDays.length > 0) {
    const signalHits = new Map<string, number>()
    for (const day of roughDays) {
      const before = signalsInWindow(entries, day, 3)
      for (const [id, n] of before) {
        signalHits.set(id, (signalHits.get(id) ?? 0) + n)
      }
    }
    const top = [...signalHits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
    if (top.length > 0 && roughDays.length >= 2) {
      const names = top.map(([id]) => labelForSignalId(id)).join(' · ')
      insights.push(
        `In the last ${withinDays} days you logged ${roughDays.length} rough day(s). In the 72 hours before those days, journal entries often mentioned: ${names}. That’s correlation from your data, not a diagnosis.`,
      )
    } else if (roughDays.length >= 1) {
      insights.push(
        `You’ve logged ${roughDays.length} rough day(s) in the last ${withinDays} days. Keep noting which signals show up — patterns get clearer after a few timestamps.`,
      )
    }
  }

  const skipped = skippedStudyDatesFromCalendar(todos, withinDays)
  if (skipped.length >= 2) {
    const overlap = skipped.filter((d) =>
      entries.some((e) => entryDate(e) === d),
    ).length
    insights.push(
      `Your calendar shows ${skipped.length} day(s) with tasks but none checked off. You journaled on ${overlap} of those — comparing those entries to better weeks can show what changed first.`,
    )
  } else if (skipped.length === 1) {
    insights.push(
      'One day recently had scheduled tasks with none completed. If that day shows up in your journal, you can tag the signals you noticed.',
    )
  }

  const skipSelf = recent.filter((e) => e.skippedStudySelfReport).length
  if (skipSelf >= 2) {
    insights.push(
      `You self-reported skipping study ${skipSelf} time(s) in this window — worth watching which signals cluster on those entries.`,
    )
  }

  if (lastAnalytics?.analyzedAt) {
    const aDate = lastAnalytics.analyzedAt.slice(0, 10)
    if (recentDates(withinDays).has(aDate)) {
      const sameWeekRough = roughEntryDates(entries, 7).some(
        (d) => Math.abs(daysApart(d, aDate)) <= 3,
      )
      if (sameWeekRough) {
        insights.push(
          'Your last practice analytics run fell close to a rough journal week — if accuracy dipped, the timeline here can sit beside how you felt (still one snapshot until you log more scores).',
        )
      }
    }
  }

  if (insights.length === 0) {
    insights.push(
      'Not enough overlapping data yet. Rough days, skipped tasks, and signal check-ins will sharpen these notes.',
    )
  }

  return insights
}

function daysApart(a: string, b: string) {
  const t = new Date(`${a}T12:00:00`).getTime() - new Date(`${b}T12:00:00`).getTime()
  return Math.round(Math.abs(t) / 86_400_000)
}
