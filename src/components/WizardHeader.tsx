import BetriebBadge from './BetriebBadge'
import WizardStepBar from './WizardStepBar'

interface WizardHeaderProps {
  betriebCode?: string
  betriebName?: string
  betriebBild?: string
  onBack?: () => void
  currentStep?: number
  totalSteps?: number
  onStepClick?: (step: number) => void
}

export default function WizardHeader({
  betriebCode,
  betriebName,
  betriebBild,
  onBack,
  currentStep,
  totalSteps,
  onStepClick,
}: WizardHeaderProps) {
  return (
    <div className="shrink-0">
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

      {currentStep && (
        <div className="flex justify-center px-5 pb-3 pt-5">
          <WizardStepBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            onStepClick={onStepClick}
          />
        </div>
      )}
    </div>
  )
}
