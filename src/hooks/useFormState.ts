import { useCallback, useState } from "react";

export interface FormData {
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shipping: {
    country: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    shippingMethod: string;
  };
  preferences: {
    newsletter: boolean;
    giftWrap: boolean;
    deliveryInstructions: string;
    promoCode: string;
  };
}

const STORAGE_KEY = "checkout-draft";

const defaultFormData: FormData = {
  personal: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  },
  shipping: {
    country: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    shippingMethod: "",
  },
  preferences: {
    newsletter: false,
    giftWrap: false,
    deliveryInstructions: "",
    promoCode: "",
  },
};

function loadDraft(): FormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FormData;
      return { ...defaultFormData, ...parsed };
    }
  } catch {
    // ignore parse errors
  }
  return defaultFormData;
}

function saveDraft(data: FormData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export function useFormState() {
  const [formData, setFormData] = useState<FormData>(loadDraft);

  const updatePersonal = useCallback((field: keyof FormData["personal"], value: string) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        personal: { ...prev.personal, [field]: value },
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const updateShipping = useCallback((field: keyof FormData["shipping"], value: string) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        shipping: { ...prev.shipping, [field]: value },
      };
      saveDraft(next);
      return next;
    });
  }, []);

  const updatePreferences = useCallback(
    (field: keyof FormData["preferences"], value: string | boolean) => {
      setFormData((prev) => {
        const next = {
          ...prev,
          preferences: { ...prev.preferences, [field]: value },
        };
        saveDraft(next);
        return next;
      });
    },
    [],
  );

  const clearDraft = useCallback(() => {
    setFormData(defaultFormData);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    formData,
    updatePersonal,
    updateShipping,
    updatePreferences,
    clearDraft,
  };
}
