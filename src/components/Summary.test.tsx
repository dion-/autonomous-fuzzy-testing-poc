import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import type { FormData } from '../hooks/useFormState'
import { Summary } from './Summary'

const baseData: FormData = {
  personal: { firstName: '', lastName: '', email: '', phone: '' },
  shipping: { country: '', address: '', city: '', state: '', postalCode: '' },
  preferences: { newsletter: false, giftWrap: false, deliveryInstructions: '', promoCode: '' },
}

describe('Summary', () => {
  it('renders collapsed by default and expands on click', async () => {
    render(<Summary data={baseData} />)
    expect(screen.getByText('Order Summary')).toBeInTheDocument()
    expect(screen.getByText('Subtotal')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button'))
    expect(screen.queryByText('Subtotal')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
  })

  it('shows discount when promo code is valid', () => {
    const data = { ...baseData, preferences: { ...baseData.preferences, promoCode: 'SAVE10' } }
    render(<Summary data={data} />)
    expect(screen.getByText('Discount')).toBeInTheDocument()
    expect(screen.getByText('-$10.00')).toBeInTheDocument()
    expect(screen.getByText('$89.99')).toBeInTheDocument()
  })

  it('shows gift wrap cost when enabled', () => {
    const data = { ...baseData, preferences: { ...baseData.preferences, giftWrap: true } }
    render(<Summary data={data} />)
    expect(screen.getByText('Gift wrap')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    expect(screen.getByText('$104.99')).toBeInTheDocument()
  })

  it('shows both discount and gift wrap together', () => {
    const data = {
      ...baseData,
      preferences: { ...baseData.preferences, promoCode: 'HALF', giftWrap: true },
    }
    render(<Summary data={data} />)
    expect(screen.getByText('Discount')).toBeInTheDocument()
    expect(screen.getByText('Gift wrap')).toBeInTheDocument()
    expect(screen.getByText('$54.99')).toBeInTheDocument()
  })
})
