import { ReactNode } from 'react'
import LeftyLogo from '../Leftylogo.svg'

interface WizardShellProps {
  stepCount?: string
  stepName?: string
  totalSteps?: number
  currentStep?: number
  contextBadge?: string
  title: string
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
  stepCount,
  stepName,
  totalSteps,
  currentStep,
  contextBadge,
  title,
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
    <div className="flex min-h-dvh flex-col bg-cheapr-page">

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

        {contextBadge && (
          <div style={{ backgroundColor: '#222222', color: '#E8A838' }} className="rounded-full px-3 py-1">
            <span className="text-[11px] font-bold">{contextBadge}</span>
          </div>
        )}

        {stepCount ? (
          <div className="text-right">
            <p className="text-[11px] font-bold tabular-nums text-cheapr-dark/35">{stepCount}</p>
            {stepName && (
              <p className="text-[10px] font-bold uppercase tracking-widest text-cheapr-dark/50">
                {stepName}
              </p>
            )}
          </div>
        ) : (
          <div className="h-9 w-9" />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center px-5 py-4">
        <div className="mx-auto w-full max-w-md">
          <h2 className="text-[1.75rem] font-black leading-tight tracking-tight text-cheapr-dark">
            {title}
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
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled}
              style={{ backgroundColor: '#222222', color: '#E8A838' }}
              className="flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-[15px] font-black tracking-wide transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-25"
            >
              {nextLabel}
              {!nextDisabled && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5 2.5L9.5 7L5 11.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex justify-center pb-6">
        <img src={LeftyLogo} alt="Lefty" className="h-7 w-auto opacity-30" />
      </div>
    </div>
  )
}
