import { ReactNode } from 'react'
import CheaprLogo from '../CheaprLogo.svg'
import BetriebBadge from './BetriebBadge'

interface WizardShellProps {
  totalSteps?: number
  currentStep?: number
  betriebCode?: string
  betriebName?: string
  betriebBild?: string
  betriebSubtitle?: string
  title: string
  titleNote?: string
  hint?: string
  children: ReactNode
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  showNext?: boolean
  extraAction?: ReactNode
}

export default function WizardShell({
  totalSteps,
  currentStep,
  betriebCode,
  betriebName,
  betriebBild,
  title,
  titleNote,
  hint,
  children,
  onBack,
  onNext,
  nextLabel = 'Weiter',
  nextDisabled = false,
  showNext = true,
  extraAction,
}: WizardShellProps) {
  const progress =
    totalSteps && currentStep ? Math.round((currentStep / totalSteps) * 100) : 0

  return (
    <div className="flex min-h-dvh flex-col bg-[#F5A200]">

      {totalSteps && currentStep && (
        <div className="h-[3px] w-full bg-cheapr-dark/15">
          <div
            className="h-full bg-cheapr-dark transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between px-5 pb-1 pt-4">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Zurück"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cheapr-dark/10 text-cheapr-dark/50 transition-colors hover:bg-cheapr-dark/15 hover:text-cheapr-dark"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 11.5L4.5 7L9 2.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="h-9 w-9" />
        )}

        <div className="flex items-center">
          {betriebCode && betriebName && (
            <BetriebBadge
              label={`${betriebCode} · ${betriebName}`}
              image={betriebBild}
              imageAlt={betriebName}
            />
          )}
        </div>

        <div className="h-9 w-9" />
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 py-4">
        <div className="mx-auto w-full max-w-md">
          <h2 className="flex flex-wrap items-baseline gap-x-2 text-[1.75rem] font-black leading-tight tracking-tight text-cheapr-dark">
            {title}
            {titleNote && (
              <span className="text-[1rem] font-bold opacity-35">{titleNote}</span>
            )}
          </h2>
          {hint && (
            <p className="mt-1.5 text-sm font-medium text-cheapr-dark/50">{hint}</p>
          )}
          <div className="mt-5">{children}</div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-2">
        <div className="mx-auto w-full max-w-md space-y-2.5">
          {extraAction}
          {showNext && onNext && (
            nextLabel ? (
              <button
                type="button"
                onClick={onNext}
                disabled={nextDisabled}
                style={{ backgroundColor: '#222222', color: '#F5A200' }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-black tracking-wide transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-25"
              >
                {nextLabel}
                {!nextDisabled && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ) : (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled}
                  style={{ backgroundColor: '#222222', color: '#F5A200' }}
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all hover:opacity-90 active:scale-[0.98] ${nextDisabled ? 'opacity-25' : ''}`}
                >
                  <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )
          )}
        </div>
      </div>

      <div className="flex justify-center pb-6">
        <img src={CheaprLogo} alt="Cheapr" className="h-7 w-auto opacity-30" />
      </div>
    </div>
  )
}
