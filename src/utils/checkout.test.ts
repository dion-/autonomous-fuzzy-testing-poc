import { describe, expect, it } from "vitest";
import type { FormData } from "../hooks/useFormState";
import { clampStep, getCanProceed, getNextStep, getPrevStep, TOTAL_STEPS } from "./checkout";

const baseFormData: FormData = {
  personal: { firstName: "", lastName: "", email: "", phone: "" },
  shipping: { country: "", address: "", city: "", state: "", postalCode: "" },
  preferences: { newsletter: false, giftWrap: false, deliveryInstructions: "", promoCode: "", giftMessage: "" },
};

const validPersonal: FormData = {
  ...baseFormData,
  personal: { firstName: "Jane", lastName: "Doe", email: "jane@example.com", phone: "+1234567890" },
};

const validShipping: FormData = {
  ...baseFormData,
  shipping: { country: "US", address: "123 Main St", city: "SF", state: "CA", postalCode: "12345" },
};

describe("TOTAL_STEPS", () => {
  it("is 4", () => {
    expect(TOTAL_STEPS).toBe(4);
  });
});

describe("getCanProceed", () => {
  it("returns false for step 0 with empty personal data", () => {
    expect(getCanProceed(0, baseFormData)).toBe(false);
  });

  it("returns true for step 0 with valid personal data", () => {
    expect(getCanProceed(0, validPersonal)).toBe(true);
  });

  it("returns false for step 1 with empty shipping data", () => {
    expect(getCanProceed(1, baseFormData)).toBe(false);
  });

  it("returns true for step 1 with valid shipping data", () => {
    expect(getCanProceed(1, validShipping)).toBe(true);
  });

  it("always returns true for steps 2 and 3", () => {
    expect(getCanProceed(2, baseFormData)).toBe(true);
    expect(getCanProceed(3, baseFormData)).toBe(true);
  });

  it("returns false for out-of-range steps", () => {
    expect(getCanProceed(-1, baseFormData)).toBe(false);
    expect(getCanProceed(4, baseFormData)).toBe(false);
  });
});

describe("getNextStep", () => {
  it("increments step when below max", () => {
    expect(getNextStep(0)).toBe(1);
    expect(getNextStep(2)).toBe(3);
  });

  it("keeps step at max when already there", () => {
    expect(getNextStep(3)).toBe(3);
  });
});

describe("getPrevStep", () => {
  it("decrements step when above min", () => {
    expect(getPrevStep(1)).toBe(0);
    expect(getPrevStep(3)).toBe(2);
  });

  it("keeps step at min when already there", () => {
    expect(getPrevStep(0)).toBe(0);
  });
});

describe("clampStep", () => {
  it("returns target when in bounds", () => {
    expect(clampStep(0, 2)).toBe(0);
    expect(clampStep(3, 0)).toBe(3);
    expect(clampStep(2, 1)).toBe(2);
  });

  it("returns currentStep when target is out of bounds", () => {
    expect(clampStep(-1, 2)).toBe(2);
    expect(clampStep(4, 2)).toBe(2);
    expect(clampStep(99, 1)).toBe(1);
  });
});
