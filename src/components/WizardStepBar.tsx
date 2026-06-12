export const WIZARD_STEP_LABELS = ['Inhalt', 'Zeit', 'Prüfen'] as const

interface WizardStepBarProps {
  currentStep: number
  totalSteps?: number
  onStepClick?: (step: number) => void
}

export default function WizardStepBar({
  currentStep,
  totalSteps = WIZARD_STEP_LABELS.length,
  onStepClick,
}: WizardStepBarProps) {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        const clickable = isDone && !!onStepClick

        return (
          <div key={step} className="flex items-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onStepClick(step)}
              className={`flex flex-col items-center gap-1 transition-all ${
                clickable ? 'cursor-pointer active:scale-95' : 'cursor-default'
              }`}
              aria-label={`Schritt ${step}: ${WIZARD_STEP_LABELS[i]}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <span
                className={`flex h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'scale-125 bg-cheapr-dark'
                    : isDone
                      ? 'bg-cheapr-dark/70 hover:bg-cheapr-dark'
                      : 'bg-cheapr-dark/20'
                }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isActive ? 'text-cheapr-dark' : isDone ? 'text-cheapr-dark/55' : 'text-cheapr-dark/25'
                }`}
              >
                {WIZARD_STEP_LABELS[i]}
              </span>
            </button>
            {step < totalSteps && (
              <div
                className={`mx-2 mb-3 h-px w-6 transition-colors duration-300 sm:w-8 ${
                  step < currentStep ? 'bg-cheapr-dark/50' : 'bg-cheapr-dark/15'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
