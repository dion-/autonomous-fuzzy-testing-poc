import { useState } from "react";
import { useFormState } from "./hooks/useFormState";
import { Step1 } from "./components/Step1";
import { Step2 } from "./components/Step2";
import { Step3 } from "./components/Step3";
import { Step4 } from "./components/Step4";
import { Navigation } from "./components/Navigation";
import { Modal } from "./components/Modal";
import { Summary } from "./components/Summary";
import { clampStep, getCanProceed, getNextStep, getPrevStep, TOTAL_STEPS } from "./utils/checkout";

export default function App() {
  const [step, setStep] = useState(0);
  const [termsOpen, setTermsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { formData, updatePersonal, updateShipping, updatePreferences, clearDraft } =
    useFormState();

  const canProceed = getCanProceed(step, formData);

  function handleNext() {
    setStep((s) => getNextStep(s));
  }

  function handleBack() {
    setStep((s) => getPrevStep(s));
  }

  function handleSkipTo(target: number) {
    setStep((s) => clampStep(target, s));
  }

  function handleSubmit() {
    setSubmitted(true);
    clearDraft();
  }

  function handleEdit(editStep: number) {
    setStep(editStep);
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm max-w-md w-full p-8 text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <svg
              className="h-6 w-6 text-gray-900"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Order Confirmed</h1>
          <p className="text-gray-600 mb-2">
            Thank you for your order! We will send you a confirmation email shortly.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            You will receive a confirmation email with your order details.
          </p>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              setStep(0);
            }}
            className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Start New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-start justify-center p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-sm w-full max-w-4xl overflow-hidden">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          {/* Sidebar Navigation */}
          <Navigation
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onBack={handleBack}
            onSkipTo={handleSkipTo}
            canProceed={canProceed}
          />

          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto">
              <div className="p-6 sm:p-8">
                <div className="mb-6">
                  <h1 className="text-xl font-semibold text-gray-900">Checkout</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete your order in a few simple steps.
                  </p>
                </div>

                <Summary data={formData} />

                <form onSubmit={(e) => e.preventDefault()} className="mt-6">
                  {step === 0 && <Step1 data={formData.personal} onChange={updatePersonal} />}
                  {step === 1 && <Step2 data={formData.shipping} onChange={updateShipping} />}
                  {step === 2 && <Step3 data={formData.preferences} onChange={updatePreferences} />}
                  {step === 3 && (
                    <Step4 data={formData} onSubmit={handleSubmit} onEdit={handleEdit} />
                  )}
                </form>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="border-t border-gray-100 p-6 sm:p-8 flex items-center justify-between bg-white">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Terms
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearDraft();
                    setStep(0);
                  }}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear Draft
                </button>
              </div>
              <div className="flex gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
                {step < TOTAL_STEPS - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
                  >
                    Place Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal open={termsOpen} onClose={() => setTermsOpen(false)} title="Terms & Conditions">
        <p className="text-gray-600 leading-relaxed">
          By placing an order you agree to our terms of service. All sales are subject to our return
          policy. We collect your personal information solely for the purpose of fulfilling your
          order and will not share it with third parties without your consent.
        </p>
      </Modal>
    </div>
  );
}
