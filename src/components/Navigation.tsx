interface NavigationProps {
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  onSkipTo: (step: number) => void
  canProceed: boolean
}

export function Navigation({
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkipTo,
  canProceed,
}: NavigationProps) {
  return (
    <nav aria-label="Checkout progress">
      <ol>
        {Array.from({ length: totalSteps }, (_, i) => (
          <li key={i} aria-current={i === currentStep ? 'step' : undefined}>
            <button type="button" onClick={() => onSkipTo(i)}>
              Step {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <div>
        <button type="button" onClick={onBack} disabled={currentStep === 0}>
          Back
        </button>
        <button type="button" onClick={onNext} disabled={!canProceed}>
          {currentStep === totalSteps - 1 ? 'Review' : 'Next'}
        </button>
      </div>
    </nav>
  )
}
