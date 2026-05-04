import type { FormData } from "../hooks/useFormState";
import { isNonEmpty, isValidEmail, isValidPhone, isValidPostalCode } from "./validators";

export const TOTAL_STEPS = 4;

export function getCanProceed(step: number, formData: FormData): boolean {
  switch (step) {
    case 0:
      return (
        isNonEmpty(formData.personal.firstName) &&
        isNonEmpty(formData.personal.lastName) &&
        isValidEmail(formData.personal.email) &&
        isValidPhone(formData.personal.phone)
      );
    case 1:
      return (
        isNonEmpty(formData.shipping.country) &&
        isNonEmpty(formData.shipping.address) &&
        isNonEmpty(formData.shipping.city) &&
        isNonEmpty(formData.shipping.state) &&
        isValidPostalCode(formData.shipping.postalCode, formData.shipping.country) &&
        isNonEmpty(formData.shipping.shippingMethod)
      );
    case 2:
      return true;
    case 3:
      return true;
    default:
      return false;
  }
}

export function getNextStep(step: number): number {
  if (step < TOTAL_STEPS - 1) return step + 1;
  return step;
}

export function getPrevStep(step: number): number {
  if (step > 0) return step - 1;
  return step;
}

export function clampStep(target: number, currentStep: number): number {
  if (target >= 0 && target < TOTAL_STEPS) return target;
  return currentStep;
}
