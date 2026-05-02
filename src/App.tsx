import { useState } from 'react'
import { useFormState } from './hooks/useFormState'
import { Step1 } from './components/Step1'
import { Step2 } from './components/Step2'
import { Step3 } from './components/Step3'
import { Step4 } from './components/Step4'
import { Navigation } from './components/Navigation'
import { Modal } from './components/Modal'
import { Summary } from './components/Summary'
import { isNonEmpty, isValidEmail, isValidPhone, isValidPostalCode } from './utils/validators'

const TOTAL_STEPS = 4

export default function App() {
  const [step, setStep] = useState(0)
  const [termsOpen, setTermsOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { formData, updatePersonal, updateShipping, updatePreferences, clearDraft } = useFormState()

  const canProceed = (() => {
    switch (step) {
      case 0:
        return (
          isNonEmpty(formData.personal.firstName) &&
          isNonEmpty(formData.personal.lastName) &&
          isValidEmail(formData.personal.email) &&
          isValidPhone(formData.personal.phone)
        )
      case 1:
        return (
          isNonEmpty(formData.shipping.country) &&
          isNonEmpty(formData.shipping.address) &&
          isNonEmpty(formData.shipping.city) &&
          isNonEmpty(formData.shipping.state) &&
          isValidPostalCode(formData.shipping.postalCode, formData.shipping.country)
        )
      case 2:
        return true
      case 3:
        return true
      default:
        return false
    }
  })()

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1)
    }
  }

  function handleSkipTo(target: number) {
    if (target >= 0 && target < TOTAL_STEPS) {
      setStep(target)
    }
  }

  function handleSubmit() {
    setSubmitted(true)
    clearDraft()
  }

  function handleEdit(editStep: number) {
    setStep(editStep)
    setSubmitted(false)
  }

  if (submitted) {
    return (
      <main>
        <h1>Order Placed</h1>
        <p>Thank you for your order!</p>
        <button type="button" onClick={() => { setSubmitted(false); setStep(0) }}>
          Start New Order
        </button>
      </main>
    )
  }

  return (
    <main>
      <h1>Checkout</h1>
      <Summary data={formData} />
      <Navigation
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onNext={handleNext}
        onBack={handleBack}
        onSkipTo={handleSkipTo}
        canProceed={canProceed}
      />
      <form onSubmit={(e) => e.preventDefault()}>
        {step === 0 && <Step1 data={formData.personal} onChange={updatePersonal} />}
        {step === 1 && <Step2 data={formData.shipping} onChange={updateShipping} />}
        {step === 2 && <Step3 data={formData.preferences} onChange={updatePreferences} />}
        {step === 3 && (
          <Step4 data={formData} onSubmit={handleSubmit} onEdit={handleEdit} />
        )}
      </form>
      <button type="button" onClick={() => setTermsOpen(true)}>
        Terms & Conditions
      </button>
      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="Terms & Conditions">
        <p>By placing an order you agree to our terms of service.</p>
      </Modal>
      <button type="button" onClick={() => { clearDraft(); setStep(0) }}>
        Clear Draft
      </button>
    </main>
  )
}
