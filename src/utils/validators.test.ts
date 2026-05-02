import { describe, expect, it } from "vitest";
import {
  calculateDiscount,
  formatPhone,
  isNonEmpty,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
} from "./validators";

describe("isValidEmail", () => {
  it("returns true for standard emails", () => {
    expect(isValidEmail("a@b.com")).toBe(true);
    expect(isValidEmail("user@example.co.uk")).toBe(true);
  });

  it("returns false for invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("plainstring")).toBe(false);
    expect(isValidEmail("@nodomain.com")).toBe(false);
    expect(isValidEmail("spaces in@name.com")).toBe(false);
    expect(isValidEmail("name@domain")).toBe(false);
  });
});

describe("isValidPhone", () => {
  it("returns true for exactly 10 digits", () => {
    expect(isValidPhone("+1234567890")).toBe(true);
    expect(isValidPhone("123-456-7890")).toBe(true);
    expect(isValidPhone("123 456 7890")).toBe(true);
    expect(isValidPhone("1234567890")).toBe(true);
  });

  it("returns false for invalid phones", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("1234567")).toBe(false);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("abc-def-ghij")).toBe(false);
    expect(isValidPhone("+12a")).toBe(false);
  });
});

describe("isNonEmpty", () => {
  it("returns true for non-empty strings", () => {
    expect(isNonEmpty("a")).toBe(true);
    expect(isNonEmpty(" hello ")).toBe(true);
  });

  it("returns false for empty or whitespace-only strings", () => {
    expect(isNonEmpty("")).toBe(false);
    expect(isNonEmpty("   ")).toBe(false);
  });
});

describe("isValidPostalCode", () => {
  it("validates US zip codes", () => {
    expect(isValidPostalCode("12345", "US")).toBe(true);
    expect(isValidPostalCode("12345-6789", "US")).toBe(true);
    expect(isValidPostalCode("1234", "US")).toBe(false);
    expect(isValidPostalCode("12345-678", "US")).toBe(false);
    expect(isValidPostalCode("", "US")).toBe(false);
  });

  it("validates Canadian postal codes", () => {
    expect(isValidPostalCode("K1A 0B1", "CA")).toBe(true);
    expect(isValidPostalCode("K1A-0B1", "CA")).toBe(true);
    expect(isValidPostalCode("K1A0B1", "CA")).toBe(true);
    expect(isValidPostalCode("12345", "CA")).toBe(false);
    expect(isValidPostalCode("", "CA")).toBe(false);
  });

  it("validates UK postal codes", () => {
    expect(isValidPostalCode("SW1A 1AA", "UK")).toBe(true);
    expect(isValidPostalCode("M1 1AA", "UK")).toBe(true);
    expect(isValidPostalCode("EC1A 1BB", "UK")).toBe(true);
    expect(isValidPostalCode("12345", "UK")).toBe(false);
    expect(isValidPostalCode("", "UK")).toBe(false);
  });

  it("falls back to non-empty for other countries", () => {
    expect(isValidPostalCode("12345", "DE")).toBe(true);
    expect(isValidPostalCode("abc", "FR")).toBe(true);
    expect(isValidPostalCode("", "AU")).toBe(false);
    expect(isValidPostalCode("   ", "JP")).toBe(false);
  });
});

describe("calculateDiscount", () => {
  it("returns correct discount for known codes", () => {
    expect(calculateDiscount("SAVE10")).toBe(0.1);
    expect(calculateDiscount("save10")).toBe(0.1);
    expect(calculateDiscount(" SAVE10 ")).toBe(0.1);
    expect(calculateDiscount("SAVE20")).toBe(0.2);
    expect(calculateDiscount("HALF")).toBe(0.5);
  });

  it("returns 0 for unknown or empty codes", () => {
    expect(calculateDiscount("")).toBe(0);
    expect(calculateDiscount("UNKNOWN")).toBe(0);
    expect(calculateDiscount("SAVE15")).toBe(0);
  });
});

describe("formatPhone", () => {
  it("formats 10-digit US numbers", () => {
    expect(formatPhone("1234567890")).toBe("(123) 456-7890");
    expect(formatPhone("123-456-7890")).toBe("(123) 456-7890");
    expect(formatPhone("(123) 456-7890")).toBe("(123) 456-7890");
  });

  it("returns empty string for empty input", () => {
    expect(formatPhone("")).toBe("");
  });
});
