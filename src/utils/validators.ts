export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string): boolean {
  const digits = value.replaceAll(/\D/g, "");
  return digits.length === 10;
}

export function isNonEmpty(value: string): boolean {
  return value.trim().length > 0;
}

export function isValidPostalCode(value: string, country: string): boolean {
  if (country === "US") {
    return /^\d{5}(-\d{4})?$/.test(value);
  }
  if (country === "CA") {
    return /^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/.test(value);
  }
  if (country === "UK") {
    return /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s?\d[A-Za-z]{2}$/.test(value);
  }
  return value.trim().length > 0;
}

export function calculateDiscount(promoCode: string): number {
  const code = promoCode.trim().toUpperCase();
  if (code === "SAVE10") return 0.1;
  if (code === "SAVE20") return 0.2;
  if (code === "HALF") return 0.5;
  return 0;
}

export function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replaceAll(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)!;
  if (!match) return "";
  return `(${match[1]}) ${match[2]}-${match[3]}`;
}

export function formatPhoneDisplay(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replaceAll(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/)!;
  return `+1 ${match[1]}-${match[2]}-${match[3]}`;
}
