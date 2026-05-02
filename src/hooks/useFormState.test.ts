import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFormState } from './useFormState'

const STORAGE_KEY = 'checkout-draft'
let store: Record<string, string> = {}

describe('useFormState', () => {
  beforeEach(() => {
    store = {}
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]) }),
      },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with default data when localStorage is empty', () => {
    const { result } = renderHook(() => useFormState())
    expect(result.current.formData.personal.firstName).toBe('')
    expect(result.current.formData.shipping.country).toBe('')
    expect(result.current.formData.preferences.newsletter).toBe(false)
  })

  it('loads draft from localStorage on init', () => {
    const draft = {
      personal: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '123' },
      shipping: { country: 'US', address: '123 Main', city: 'SF', state: 'CA', postalCode: '12345' },
      preferences: { newsletter: true, giftWrap: true, deliveryInstructions: 'Leave at door', promoCode: 'SAVE10' },
    }
    store[STORAGE_KEY] = JSON.stringify(draft)
    const { result } = renderHook(() => useFormState())
    expect(result.current.formData.personal.firstName).toBe('Jane')
    expect(result.current.formData.preferences.newsletter).toBe(true)
  })

  it('handles corrupted localStorage gracefully', () => {
    store[STORAGE_KEY] = 'not-json'
    const { result } = renderHook(() => useFormState())
    expect(result.current.formData.personal.firstName).toBe('')
  })

  it('updatePersonal updates field and persists', () => {
    const { result } = renderHook(() => useFormState())
    act(() => {
      result.current.updatePersonal('firstName', 'Jane')
    })
    expect(result.current.formData.personal.firstName).toBe('Jane')
    const stored = JSON.parse(store[STORAGE_KEY])
    expect(stored.personal.firstName).toBe('Jane')
  })

  it('updateShipping updates field and persists', () => {
    const { result } = renderHook(() => useFormState())
    act(() => {
      result.current.updateShipping('country', 'CA')
    })
    expect(result.current.formData.shipping.country).toBe('CA')
    const stored = JSON.parse(store[STORAGE_KEY])
    expect(stored.shipping.country).toBe('CA')
  })

  it('updatePreferences updates boolean field and persists', () => {
    const { result } = renderHook(() => useFormState())
    act(() => {
      result.current.updatePreferences('newsletter', true)
    })
    expect(result.current.formData.preferences.newsletter).toBe(true)
    const stored = JSON.parse(store[STORAGE_KEY])
    expect(stored.preferences.newsletter).toBe(true)
  })

  it('updatePreferences updates string field and persists', () => {
    const { result } = renderHook(() => useFormState())
    act(() => {
      result.current.updatePreferences('promoCode', 'SAVE20')
    })
    expect(result.current.formData.preferences.promoCode).toBe('SAVE20')
    const stored = JSON.parse(store[STORAGE_KEY])
    expect(stored.preferences.promoCode).toBe('SAVE20')
  })

  it('clearDraft resets state and removes localStorage', () => {
    const { result } = renderHook(() => useFormState())
    act(() => {
      result.current.updatePersonal('firstName', 'Jane')
    })
    expect(store[STORAGE_KEY]).toBeDefined()

    act(() => {
      result.current.clearDraft()
    })
    expect(result.current.formData.personal.firstName).toBe('')
    expect(store[STORAGE_KEY]).toBeUndefined()
  })

  it('handles localStorage setItem errors gracefully', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    const { result } = renderHook(() => useFormState())
    act(() => {
      result.current.updatePersonal('firstName', 'Jane')
    })
    expect(result.current.formData.personal.firstName).toBe('Jane')
  })

  it('handles localStorage removeItem errors gracefully', () => {
    vi.spyOn(window.localStorage, 'removeItem').mockImplementation(() => {
      throw new Error('Storage error')
    })
    const { result } = renderHook(() => useFormState())
    act(() => {
      result.current.clearDraft()
    })
    expect(result.current.formData.personal.firstName).toBe('')
  })
})
