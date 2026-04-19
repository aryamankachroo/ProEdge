function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export type OnboardingStepDef = {
  title: string
  description: string
}

type Props = {
  steps: OnboardingStepDef[]
  currentStep: number
  onStepSelect?: (index: number) => void
}

export function OnboardingSideStepper({
  steps,
  currentStep,
  onStepSelect,
}: Props) {
  const last = steps.length - 1

  return (
    <nav
      className="w-full max-w-md lg:max-w-none"
      aria-label="Onboarding progress"
    >
      <ol className="flex flex-col">
        {steps.map((s, i) => {
          const isComplete = i < currentStep
          const isActive = i === currentStep
          const isUpcoming = i > currentStep
          const segmentDone = currentStep > i

          const iconCol = (
            <div className="flex w-10 shrink-0 flex-col items-center sm:w-11">
              {isComplete && (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d97706] text-white shadow-sm ring-2 ring-[#d97706]/25 sm:h-10 sm:w-10"
                  aria-hidden
                >
                  <CheckIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              )}
              {isActive && (
                <div
                  className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d97706] text-white shadow-[0_0_0_4px_rgba(251,191,36,0.35),0_8px_24px_-6px_rgba(217,119,6,0.55)] ring-4 ring-amber-400/30 sm:h-10 sm:w-10"
                  aria-current="step"
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}
              {isUpcoming && (
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#d6cfc4] bg-white text-xs font-semibold text-[#a8988c] dark:border-[#5c5a56] dark:bg-[#2a2927] dark:text-[#ebe7e0] sm:h-10 sm:w-10"
                  aria-hidden
                >
                  {i + 1}
                </div>
              )}
              {i < last ? (
                <div
                  className={`mt-2 min-h-[2.75rem] w-[3px] flex-1 rounded-full sm:min-h-[3.25rem] ${
                    segmentDone
                      ? 'bg-gradient-to-b from-[#f59e0b] to-[#fbbf24]'
                      : 'bg-[#e8dfd4] dark:bg-[#454440]'
                  }`}
                  aria-hidden
                />
              ) : null}
            </div>
          )

          const textCol = (
            <div
              className={`min-w-0 pb-10 pt-0.5 ${i === last ? 'pb-2' : ''} ${
                isUpcoming ? 'opacity-55' : ''
              }`}
            >
              <p
                className={`text-[0.95rem] font-bold leading-snug sm:text-base ${
                  isActive
                    ? 'text-[#2c2825] dark:text-[#fafaf8]'
                    : isComplete
                      ? 'text-[#3d3835] dark:text-[#f2f0ec]'
                      : 'text-[#8a7b70] dark:text-[#ddd8d0]'
                }`}
              >
                {s.title}
              </p>
              <p
                className={`mt-1 text-sm leading-relaxed ${
                  isActive
                    ? 'text-[#6b5f56] dark:text-[#ebe6df]'
                    : 'text-[#9a8b7e] dark:text-[#d2cdc4]'
                }`}
              >
                {s.description}
              </p>
            </div>
          )

          const inner = (
            <>
              {iconCol}
              {textCol}
            </>
          )

          if (isComplete && onStepSelect) {
            return (
              <li key={s.title}>
                <button
                  type="button"
                  onClick={() => onStepSelect(i)}
                  className="flex w-full gap-4 rounded-2xl text-left transition hover:bg-white/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97706] dark:hover:bg-white/[0.06]"
                >
                  {inner}
                </button>
              </li>
            )
          }

          return (
            <li key={s.title} className="flex gap-4">
              {inner}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
