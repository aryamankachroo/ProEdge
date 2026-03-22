import { useTheme } from '../context/ThemeProvider'

export function ThemeToggle() {
  const { preference, resolved, cycle } = useTheme()
  const hint =
    preference === 'system'
      ? `System (${resolved})`
      : preference === 'dark'
        ? 'Dark'
        : 'Light'

  return (
    <button
      type="button"
      onClick={cycle}
      className="fixed bottom-6 left-6 z-[10001] flex h-11 w-11 items-center justify-center rounded-full border border-[#e8dfd4] bg-white/95 text-[#2c2825] shadow-[0_8px_30px_-8px_rgba(44,40,37,0.25)] backdrop-blur-md transition hover:bg-[#faf7f3] dark:border-[#3d3c38] dark:bg-[#2a2927]/95 dark:text-[#f0ebe4] dark:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.45)] dark:hover:bg-[#353432]"
      aria-label={`Theme: ${hint}. Click to cycle light, dark, or system.`}
      title={`Theme: ${hint}`}
    >
      {resolved === 'dark' ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  )
}
