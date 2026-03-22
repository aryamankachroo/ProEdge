import type { CalendarRecommendationKind, StudyDayTodo } from '../types/profile'

export const CALENDAR_KIND_ORDER: CalendarRecommendationKind[] = [
  'weak_section',
  'science',
  'cars',
  'anki',
  'resource',
  'mixed',
  'recap',
  'general',
]

export const CALENDAR_KIND_LABELS: Record<CalendarRecommendationKind, string> = {
  weak_section: 'Weak section',
  science: 'Science practice',
  cars: 'CARS',
  anki: 'Anki / review',
  resource: 'Prep resource',
  mixed: 'Mixed / FL',
  recap: 'Recap / planning',
  general: 'General',
}

/** Badge + row accent (Tailwind) per kind */
export const CALENDAR_KIND_STYLES: Record<
  CalendarRecommendationKind,
  { badge: string; dot: string }
> = {
  weak_section: {
    badge: 'bg-amber-100 text-amber-900 ring-amber-200/80',
    dot: 'bg-amber-500',
  },
  science: {
    badge: 'bg-emerald-100 text-emerald-900 ring-emerald-200/80',
    dot: 'bg-emerald-500',
  },
  cars: {
    badge: 'bg-violet-100 text-violet-900 ring-violet-200/80',
    dot: 'bg-violet-500',
  },
  anki: {
    badge: 'bg-sky-100 text-sky-900 ring-sky-200/80',
    dot: 'bg-sky-500',
  },
  resource: {
    badge: 'bg-rose-100 text-rose-900 ring-rose-200/80',
    dot: 'bg-rose-500',
  },
  mixed: {
    badge: 'bg-slate-200 text-slate-800 ring-slate-300/80',
    dot: 'bg-slate-500',
  },
  recap: {
    badge: 'bg-stone-200 text-stone-800 ring-stone-300/80',
    dot: 'bg-stone-500',
  },
  general: {
    badge: 'bg-neutral-100 text-neutral-800 ring-neutral-200/80',
    dot: 'bg-neutral-400',
  },
}

const KIND_SET = new Set<string>(CALENDAR_KIND_ORDER)

export function isCalendarRecommendationKind(
  s: string,
): s is CalendarRecommendationKind {
  return KIND_SET.has(s)
}

/** Best-effort label for older todos with no `kind`. */
export function inferKindFromTitle(title: string): CalendarRecommendationKind {
  const t = title.toLowerCase()
  if (/\bcars\b|passage|reading comp/i.test(t)) return 'cars'
  if (/\banki\b|flashcard|deck/i.test(t)) return 'anki'
  if (/\bkaplan\b|\buworld\b|\bprinceton\b|\bblueprint\b|\bexamkrackers\b/i.test(t))
    return 'resource'
  if (/weak|priority|shaky|diagnostic focus/i.test(t)) return 'weak_section'
  if (/recap|plan tomorrow|journal|evening/i.test(t)) return 'recap'
  if (/full.length|mixed block|timed/i.test(t)) return 'mixed'
  if (/bio|chem|phys|psych|soc|science|qbank|question/i.test(t)) return 'science'
  return 'general'
}

export function effectiveTodoKind(
  todo: StudyDayTodo,
): CalendarRecommendationKind {
  return todo.kind ?? inferKindFromTitle(todo.title)
}
