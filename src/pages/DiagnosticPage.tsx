import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'

export function DiagnosticPage() {
  const navigate = useNavigate()

  return (
    <AppShell active="diagnostic">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-2xl flex-col px-5 py-10 md:px-8 md:py-14">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 self-start text-sm font-semibold text-[#6b5f56] hover:text-[#2c2825]"
        >
          ← Back
        </button>

        <h1 className="onboarding-serif mb-4 text-3xl font-semibold text-[#2c2825] md:text-4xl">
          Diagnostic exam
        </h1>
        <p className="mb-8 text-[0.95rem] leading-relaxed text-[#6b5f56]">
          This mini diagnostic follows the{' '}
          <strong className="font-semibold text-[#5a4f47]">
            full MCAT section order
          </strong>{' '}
          (Chem/Phys → CARS → Bio/Biochem → Psych/Soc) with a couple of questions
          per section — a quick baseline without a full 7+ hour sit.
        </p>

        <section className="rounded-2xl border border-white/40 bg-white/25 p-6 shadow-[0_8px_32px_rgba(31,38,135,0.15)] backdrop-blur-xl md:p-7">
          <p className="mb-3 text-sm font-semibold text-[#5a4f47]">
            Before you start
          </p>
          <ul className="list-inside list-disc space-y-2 text-sm leading-relaxed text-[#6b5f56]">
            <li>Block a single sitting (or two blocks with a short break).</li>
            <li>Use official timing; no peeking at notes between sections.</li>
            <li>
              Afterward, import your score report PDF on the previous step, or
              enter your total manually in your profile.
            </li>
          </ul>
        </section>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => navigate('/diagnostic/exam')}
            className="rounded-full bg-[#2c2825] px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1f1c1a]"
          >
            Start full-length diagnostic
          </button>
          <button
            type="button"
            onClick={() => navigate('/study-plan')}
            className="rounded-full border border-white/50 bg-white/40 px-6 py-2.5 text-sm font-semibold text-[#4a423c] backdrop-blur-lg transition hover:bg-white/60"
          >
            I’ll use my study plan first
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="rounded-full bg-[#5f7f6a] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(95,127,106,0.55)] transition hover:bg-[#536b5d]"
          >
            Done for now
          </button>
        </div>
      </div>
    </AppShell>
  )
}
