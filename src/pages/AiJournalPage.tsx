import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BURNOUT_CATEGORY_LABELS,
  BURNOUT_SIGNALS,
  signalsForCategory,
  type BurnoutSignalDef,
} from '../lib/burnoutSignals'
import { buildJournalPatternInsights } from '../lib/journalPatterns'
import { suggestJournalModeContext } from '../lib/journalSuggestion'
import { useProfile } from '../context/useProfile'
import type {
  AiJournalEntry,
  BurnoutCategory,
  DayQuality,
  JournalMode,
} from '../types/journal'

const MODE_LABELS: Record<JournalMode, { title: string; blurb: string }> = {
  'session-debrief': {
    title: 'Structured session debrief',
    blurb:
      'After a block, name what showed up. Questions match the signals you track.',
  },
  'brain-dump': {
    title: 'Brain dump',
    blurb:
      'Still centers your chosen signals — short lines per pattern, then vent if you need to.',
  },
  'weekly-reflection': {
    title: 'Weekly reflection',
    blurb:
      'Zoom out once a week. You don’t have to use every mode; this one connects days.',
  },
}

const CATEGORIES: BurnoutCategory[] = [
  'physical',
  'mental',
  'behavioral',
  'emotional',
]

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `j-${Date.now()}`
}

export function AiJournalPage() {
  const navigate = useNavigate()
  const { profile, setProfile } = useProfile()
  const {
    trackedBurnoutSignalIds,
    aiJournalEntries,
    studyDayTodos,
    lastAiAnalytics,
  } = profile

  const [manageSignals, setManageSignals] = useState(false)
  const [flowMode, setFlowMode] = useState<JournalMode | null>(null)

  const trackedSet = useMemo(
    () => new Set(trackedBurnoutSignalIds),
    [trackedBurnoutSignalIds],
  )

  const trackedDefs = useMemo(
    () =>
      trackedBurnoutSignalIds
        .map((id) => BURNOUT_SIGNALS.find((s) => s.id === id))
        .filter((s): s is BurnoutSignalDef => Boolean(s)),
    [trackedBurnoutSignalIds],
  )

  const suggestion = useMemo(
    () => suggestJournalModeContext(aiJournalEntries, studyDayTodos),
    [aiJournalEntries, studyDayTodos],
  )

  const patternLines = useMemo(
    () =>
      buildJournalPatternInsights(
        aiJournalEntries,
        studyDayTodos,
        lastAiAnalytics,
        30,
      ),
    [aiJournalEntries, studyDayTodos, lastAiAnalytics],
  )

  const needsSetup = trackedBurnoutSignalIds.length === 0

  const toggleSignal = (id: string) => {
    setProfile({
      trackedBurnoutSignalIds: trackedSet.has(id)
        ? trackedBurnoutSignalIds.filter((x) => x !== id)
        : [...trackedBurnoutSignalIds, id],
    })
  }

  const addSignalFromSelect = (signalId: string) => {
    if (!signalId || trackedSet.has(signalId)) return
    setProfile({ trackedBurnoutSignalIds: [...trackedBurnoutSignalIds, signalId] })
  }

  return (
    <div className="onboarding-shell min-h-dvh pb-24">
      <header className="app-shell-header">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <Link to="/" className="app-shell-brand" aria-label="ProEdge home">
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
            <button
              type="button"
              onClick={() => navigate('/calendar')}
              className="shell-nav-btn"
            >
              Calendar
            </button>
            <button
              type="button"
              onClick={() => navigate('/analytics')}
              className="shell-nav-btn"
            >
              AI analytics
            </button>
            <span className="shell-nav-btn-active">AI journal</span>
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
        <h1 className="onboarding-serif text-3xl font-semibold tracking-tight text-[#2c2825] dark:text-[#fafaf8] sm:text-4xl">
          AI journal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#7a6e66] dark:text-[#ebe7e0] sm:text-base">
          Track burnout the way it actually shows up for you — physical, mental,
          behavioral, emotional. We never reduce this to a score. Check-ins ask
          about the signals you chose, not generic mood questions. Entries save
          with your profile here for now; the same shape is ready to stream to
          Snowflake for model-driven insights later.
        </p>

        {(needsSetup || manageSignals) && (
          <section className="mt-10 rounded-2xl border border-[#e8dfd4] bg-white/90 p-5 dark:border-[#454440] dark:bg-[#2c2b29]/96 sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#ebe7e0]">
              {needsSetup ? 'Choose signals to track' : 'Manage signals'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#7a6e66] dark:text-[#e3dfd8]">
              Pick what you recognize in yourself. Your journal will check in on
              these from day one. Use the dropdowns per category to add; remove
              with the × on each chip.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {CATEGORIES.map((cat) => {
                const pool = signalsForCategory(cat).filter(
                  (s) => !trackedSet.has(s.id),
                )
                return (
                  <div key={cat}>
                    <label className="text-xs font-bold uppercase tracking-wide text-[#7a6e66] dark:text-[#e3dfd8]">
                      {BURNOUT_CATEGORY_LABELS[cat]}
                    </label>
                    <select
                      className="onboarding-input mt-2 text-sm"
                      value=""
                      onChange={(e) => {
                        addSignalFromSelect(e.target.value)
                        e.target.value = ''
                      }}
                      aria-label={`Add ${BURNOUT_CATEGORY_LABELS[cat]} signal`}
                    >
                      <option value="">
                        Add {BURNOUT_CATEGORY_LABELS[cat].toLowerCase()} signal…
                      </option>
                      {pool.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {trackedDefs.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleSignal(s.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#cfe5d6] bg-[#f4faf6] px-3 py-1.5 text-xs font-semibold text-[#1a3d2e] hover:bg-[#e8f2ec] dark:border-[#3d5244] dark:bg-[#243529]/50 dark:!text-[#d8ece0] dark:hover:bg-[#2d4a38]/55"
                >
                  {s.label}
                  <span className="text-[#5f7f6a] dark:!text-[#9bc4a8]" aria-hidden>
                    ×
                  </span>
                </button>
              ))}
              {trackedDefs.length === 0 ? (
                <p className="text-sm text-[#9a8b7e] dark:text-[#ddd8d0]">
                  No signals yet — add at least one to start journaling.
                </p>
              ) : null}
            </div>

            {!needsSetup ? (
              <button
                type="button"
                className="mt-6 text-sm font-semibold text-[#5f7f6a] hover:text-[#2c2825] dark:!text-[#9bc4a8] dark:hover:!text-[#c8e6d0]"
                onClick={() => setManageSignals(false)}
              >
                Done editing signals
              </button>
            ) : null}
          </section>
        )}

        {!needsSetup && !flowMode ? (
          <>
            <section className="mt-10 rounded-2xl border border-[#d4c4e8] bg-gradient-to-br from-[#f5f0ff] to-[#faf7f3] p-5 dark:border-[#4c3d6b]/50 dark:from-[#2a2438] dark:to-[#2c2b29] sm:p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6b5a8c] dark:text-[#ebe3fa]">
                Suggested for right now
              </p>
              <p className="mt-2 text-base font-semibold text-[#2c2825] dark:text-[#fafaf8]">
                {MODE_LABELS[suggestion.mode].title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#5c534c] dark:text-[#ebe7e0]">
                {suggestion.reason}
              </p>
              <button
                type="button"
                onClick={() => setFlowMode(suggestion.mode)}
                className="journal-btn-on-dark mt-4 rounded-xl bg-[#5f7f6a] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(95,127,106,0.5)] hover:bg-[#536b5d]"
              >
                Start with this mode
              </button>
            </section>

            <section className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#9a8b7e] dark:text-[#ebe7e0]">
                All modes
              </h2>
              <p className="mt-1 text-xs text-[#7a6e66] dark:text-[#e3dfd8]">
                Use what fits — you don’t need all three every week.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-3">
                {(
                  [
                    'session-debrief',
                    'brain-dump',
                    'weekly-reflection',
                  ] as const
                ).map((m) => (
                  <li key={m}>
                    <button
                      type="button"
                      onClick={() => setFlowMode(m)}
                      className="group flex h-full w-full cursor-pointer flex-col rounded-2xl border border-[#ebe5dc] bg-white/95 p-4 text-left transition hover:border-[#5f7f6a]/50 hover:shadow-md dark:border-[#454440] dark:bg-[#2c2b29]/96 dark:hover:border-[#5f7f6a]/45 dark:hover:shadow-[0_8px_28px_-12px_rgba(0,0,0,0.45)]"
                    >
                      <span className="font-semibold text-[#2c2825] dark:text-[#fafaf8]">
                        {MODE_LABELS[m].title}
                      </span>
                      <span className="mt-2 flex-1 text-xs leading-relaxed text-[#7a6e66] dark:text-[#e3dfd8]">
                        {MODE_LABELS[m].blurb}
                      </span>
                      <span className="mt-3 text-xs font-bold text-[#5f7f6a] group-hover:text-[#2c2825] dark:text-[#c8edd4] dark:group-hover:text-[#dff5e6]">
                        Open →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <button
              type="button"
              onClick={() => setManageSignals(true)}
              className="mt-8 text-sm font-semibold text-[#5f7f6a] underline-offset-2 hover:text-[#2c2825] hover:underline dark:!text-[#9bc4a8] dark:hover:!text-[#c8e6d0]"
            >
              Manage my signals
            </button>
          </>
        ) : null}

        {!needsSetup && flowMode ? (
          <JournalEntryForm
            mode={flowMode}
            trackedDefs={trackedDefs}
            onCancel={() => setFlowMode(null)}
            onSave={(entry) => {
              setProfile({
                aiJournalEntries: [...aiJournalEntries, entry],
              })
              setFlowMode(null)
            }}
          />
        ) : null}

        <section className="mt-14 border-t border-[#ebe5dc] pt-10 dark:border-[#454440]">
          <h2 className="onboarding-serif text-xl font-semibold text-[#2c2825] dark:text-[#fafaf8]">
            Pattern notes
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#7a6e66] dark:text-[#ebe7e0]">
            No burnout index — only notes from your journal text, signal tags,
            rough days, skipped tasks on the calendar, and how they line up in
            time. These lines are rule-based on your device today; an LLM over
            Snowflake-stored history can replace this layer without changing what
            students log.
          </p>
          <ul className="mt-6 space-y-4">
            {patternLines.map((line, i) => (
              <li
                key={i}
                className="rounded-xl border border-[#e8dfd4] bg-[#faf9f7] p-4 text-sm leading-relaxed text-[#3d3835] dark:border-[#454440] dark:bg-[#2c2b29]/96 dark:text-[#f4f3f0]"
              >
                {line}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

function JournalEntryForm({
  mode,
  trackedDefs,
  onCancel,
  onSave,
}: {
  mode: JournalMode
  trackedDefs: BurnoutSignalDef[]
  onCancel: () => void
  onSave: (e: AiJournalEntry) => void
}) {
  const [dayQuality, setDayQuality] = useState<DayQuality>('ok')
  const [activeIds, setActiveIds] = useState<string[]>([])
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [freeText, setFreeText] = useState('')
  const [skippedStudy, setSkippedStudy] = useState(false)
  const [feltTerrible, setFeltTerrible] = useState(false)

  const toggleActive = (id: string) => {
    setActiveIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const signalIdsFromBrainDumpLines = () =>
    trackedDefs
      .filter((s) => (responses[`bd-${s.id}`] ?? '').trim().length > 0)
      .map((s) => s.id)

  const canSave = () => {
    if (mode === 'brain-dump') {
      if (trackedDefs.length === 0) return freeText.trim().length > 0
      const anyLine = signalIdsFromBrainDumpLines().length > 0
      return anyLine || freeText.trim().length > 0
    }
    if (mode === 'session-debrief') {
      return activeIds.length > 0
    }
    if (mode === 'weekly-reflection') {
      return (
        activeIds.length > 0 ||
        (responses.weeklyShift ?? '').trim().length > 0
      )
    }
    return true
  }

  const handleSave = () => {
    if (!canSave()) return
    const fromDump = signalIdsFromBrainDumpLines()
    const entry: AiJournalEntry = {
      id: newId(),
      createdAt: new Date().toISOString(),
      mode,
      activeSignalIds:
        mode === 'brain-dump' ? fromDump : [...activeIds],
      responses: { ...responses },
      freeText: freeText.trim() || undefined,
      dayQuality,
      skippedStudySelfReport: skippedStudy || undefined,
      feltTerrible: feltTerrible || undefined,
    }
    onSave(entry)
  }

  const activeDefs = trackedDefs.filter((s) => activeIds.includes(s.id))

  return (
    <section className="mt-10 rounded-2xl border border-[#5f7f6a]/30 bg-white/95 p-5 shadow-lg dark:border-[#454440] dark:bg-[#2c2b29]/96 dark:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.45)] sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#5f7f6a] dark:text-[#c8edd4]">
            New entry
          </p>
          <h2 className="onboarding-serif mt-1 text-2xl font-semibold text-[#2c2825] dark:text-[#fafaf8]">
            {MODE_LABELS[mode].title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-[#6b5e54] hover:bg-[#f5f0eb] dark:!text-[#c4bdb4] dark:hover:bg-[#383633]"
        >
          Back
        </button>
      </div>

      {mode === 'brain-dump' && trackedDefs.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]">
            Your tracked signals
          </p>
          <p className="mt-1 text-xs leading-relaxed text-[#7a6e66] dark:text-[#e3dfd8]">
            Questions are tied to what you chose — not a generic mood check.
            Answer only lines that fit; even one word helps your history.
          </p>
          <ul className="mt-5 space-y-4">
            {trackedDefs.map((s) => {
              const key = `bd-${s.id}`
              return (
                <li key={s.id}>
                  <label
                    htmlFor={key}
                    className="text-sm font-medium text-[#3d3835] dark:text-[#f6f5f3]"
                  >
                    {s.label}
                  </label>
                  <textarea
                    id={key}
                    rows={2}
                    value={responses[key] ?? ''}
                    onChange={(e) =>
                      setResponses((r) => ({ ...r, [key]: e.target.value }))
                    }
                    placeholder="e.g. not today · 2 hr scroll · yes, after CARS"
                    className="onboarding-input mt-1.5 text-sm"
                  />
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}

      {mode !== 'brain-dump' && trackedDefs.length > 0 ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]">
            {mode === 'weekly-reflection'
              ? 'Which signals showed up at least once this week?'
              : 'Which signals showed up during or after this session?'}
          </p>
          <p className="mt-1 text-xs text-[#7a6e66] dark:text-[#e3dfd8]">
            {mode === 'session-debrief'
              ? 'Pick at least one — follow-ups appear for what you check.'
              : 'Check any that applied; add detail below.'}
          </p>
          <ul className="mt-3 space-y-2">
            {trackedDefs.map((s) => (
              <li key={s.id}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#ebe5dc] bg-[#faf9f7] p-3 text-sm hover:bg-[#f5f0eb] dark:border-[#454440] dark:bg-[#383633]/70 dark:hover:bg-[#454440]/55">
                  <input
                    type="checkbox"
                    checked={activeIds.includes(s.id)}
                    onChange={() => toggleActive(s.id)}
                    className="mt-1 h-4 w-4 rounded border-[#c4b8a8] text-[#5f7f6a] dark:border-[#6b6560]"
                  />
                  <span className="text-[#3d3835] dark:text-[#f6f5f3]">{s.label}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === 'brain-dump' ? (
        <div className="mt-8">
          <label
            htmlFor="journal-dump"
            className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]"
          >
            {trackedDefs.length > 0
              ? 'Anything else on your mind? (optional)'
              : 'Say whatever you need'}
          </label>
          <textarea
            id="journal-dump"
            rows={trackedDefs.length > 0 ? 6 : 10}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Vent, spiral, half-formed thoughts…"
            className="onboarding-input mt-2 min-h-[8rem] resize-y text-sm"
          />
          {trackedDefs.length > 0 ? (
            <p className="mt-2 text-xs text-[#9a8b7e] dark:text-[#ddd8d0]">
              Save needs at least one signal line above or something here.
            </p>
          ) : null}
        </div>
      ) : null}

      {mode === 'session-debrief' && activeDefs.length > 0 ? (
        <div className="mt-8 space-y-5">
          <p className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]">
            Quick follow-ups for what you checked
          </p>
          {activeDefs.map((s) => {
            const key = `fu-${s.id}`
            return (
              <div key={s.id}>
                <label
                  htmlFor={key}
                  className="text-xs font-semibold uppercase tracking-wide text-[#7a6e66]"
                >
                  {s.label}
                </label>
                <p className="mt-1 text-sm text-[#5c534c]">{s.debriefFollowUp}</p>
                <textarea
                  id={key}
                  rows={3}
                  value={responses[key] ?? ''}
                  onChange={(e) =>
                    setResponses((r) => ({ ...r, [key]: e.target.value }))
                  }
                  className="onboarding-input mt-2 text-sm"
                />
              </div>
            )
          })}
        </div>
      ) : null}

      {mode === 'weekly-reflection' ? (
        <div className="mt-8 space-y-5">
          {activeDefs.length > 0 ? (
            <div>
              <p className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]">
                One line per signal you care about this week
              </p>
              {activeDefs.map((s) => {
                const key = `wk-${s.id}`
                return (
                  <div key={s.id} className="mt-4">
                    <label htmlFor={key} className="text-xs text-[#7a6e66] dark:text-[#e3dfd8]">
                      {s.label}
                      {s.weeklyAngle ? ` — ${s.weeklyAngle}` : ''}
                    </label>
                    <textarea
                      id={key}
                      rows={2}
                      value={responses[key] ?? ''}
                      onChange={(e) =>
                        setResponses((r) => ({ ...r, [key]: e.target.value }))
                      }
                      className="onboarding-input mt-1 text-sm"
                    />
                  </div>
                )
              })}
            </div>
          ) : null}
          <div>
            <label
              htmlFor="weekly-shift"
              className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]"
            >
              What felt different compared to last week?
            </label>
            <textarea
              id="weekly-shift"
              rows={4}
              value={responses.weeklyShift ?? ''}
              onChange={(e) =>
                setResponses((r) => ({ ...r, weeklyShift: e.target.value }))
              }
              className="onboarding-input mt-2 text-sm"
            />
          </div>
        </div>
      ) : null}

      {mode === 'session-debrief' ? (
        <div className="mt-6">
          <label
            htmlFor="debrief-extra"
            className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]"
          >
            Anything else about the session? (optional)
          </label>
          <textarea
            id="debrief-extra"
            rows={3}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            className="onboarding-input mt-2 text-sm"
          />
        </div>
      ) : null}

      <div className="mt-10 border-t border-[#ebe5dc] pt-8 dark:border-[#454440]">
        <p className="text-sm font-semibold text-[#2c2825] dark:text-[#fafaf8]">
          Overall day tag
        </p>
        <p className="mt-1 text-xs leading-relaxed text-[#7a6e66] dark:text-[#e3dfd8]">
          For your timeline only — the prompts above are about your specific
          signals.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['good', 'ok', 'rough'] as const).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setDayQuality(q)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                dayQuality === q
                  ? 'journal-btn-on-dark bg-[#2c2825] text-white'
                  : 'border border-[#e8dfd4] bg-[#faf7f3] text-[#5c534c] hover:border-[#b8a99a] dark:border-[#454440] dark:bg-[#383633] dark:!text-[#d8d4ce] dark:hover:border-[#5c5a56]'
              }`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 space-y-3 rounded-xl border border-[#ebe5dc] bg-[#faf9f7] p-4">
        <label className="flex cursor-pointer items-center gap-3 text-sm text-[#3d3835]">
          <input
            type="checkbox"
            checked={skippedStudy}
            onChange={(e) => setSkippedStudy(e.target.checked)}
            className="h-4 w-4 rounded border-[#c4b8a8] text-[#5f7f6a]"
          />
          I skipped study I meant to do today
        </label>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-[#3d3835]">
          <input
            type="checkbox"
            checked={feltTerrible}
            onChange={(e) => setFeltTerrible(e.target.checked)}
            className="h-4 w-4 rounded border-[#c4b8a8] text-[#5f7f6a]"
          />
          I felt terrible today (for timeline patterning)
        </label>
      </div>

      {mode === 'session-debrief' && activeIds.length === 0 ? (
        <p className="mt-4 text-sm text-[#b45309] dark:text-[#ffd9a8]" role="status">
          Choose at least one signal above to save this debrief.
        </p>
      ) : null}
      {mode === 'weekly-reflection' &&
      activeIds.length === 0 &&
      !(responses.weeklyShift ?? '').trim() ? (
        <p className="mt-4 text-sm text-[#b45309] dark:text-[#ffd9a8]" role="status">
          Check a signal or write what felt different vs. last week to save.
        </p>
      ) : null}

      <button
        type="button"
        disabled={!canSave()}
        onClick={handleSave}
        className="journal-btn-on-dark mt-8 w-full rounded-xl bg-[#2c2825] py-3 text-sm font-semibold text-white hover:bg-[#1f1c1a] disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto sm:px-10"
      >
        Save entry
      </button>
    </section>
  )
}
