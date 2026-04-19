import { useState, type ComponentProps } from 'react'

type Props = Omit<ComponentProps<'input'>, 'type'>

export function PasswordInput(props: Props) {
  const { className = '', ...rest } = props
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        {...rest}
        type={visible ? 'text' : 'password'}
        className={`onboarding-input w-full font-normal pr-12 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setVisible((v) => !v)}
        className={[
          'absolute right-1.5 top-1/2 z-[1] flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg',
          'text-[#5f524a] shadow-sm ring-1 ring-black/[0.06] hover:bg-black/[0.07] hover:text-[#2c2825]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5f7f6a]',
          /* Dark: strong contrast — near-white icon on lifted surface */
          'dark:text-white dark:ring-white/35 dark:bg-[#3d4540] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
          'dark:hover:bg-[#4d5751] dark:hover:text-white dark:hover:ring-white/45',
        ].join(' ')}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <IconEyeOff /> : <IconEye />}
      </button>
    </div>
  )
}

function IconEye() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function IconEyeOff() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
