import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { FormData } from '../hooks/useFormState'
import { Step4 } from './Step4'

const baseData: FormData = {
  personal: { firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com', phone: '+1234567890' },
  shipping: { country: 'US', address: '123 Main', city: 'SF', state: 'CA', postalCode: '12345' },
  preferences: { newsletter: false, giftWrap: false, deliveryInstructions: '', promoCode: '' },
}

describe('Step4', () => {
  it('renders review sections with data', () => {
    const data = { ...baseData, preferences: { ...baseData.preferences, newsletter: true } }
    render(<Step4 data={data} onSubmit={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('123 Main')).toBeInTheDocument()
    expect(screen.getByText('Newsletter: Yes')).toBeInTheDocument()
    expect(screen.getByText('Gift wrap: No')).toBeInTheDocument()
  })

  it('calls onEdit when clicking edit buttons', async () => {
    const onEdit = vi.fn()
    render(<Step4 data={baseData} onSubmit={vi.fn()} onEdit={onEdit} />)
    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[0])
    expect(onEdit).toHaveBeenCalledWith(0)
    await userEvent.click(editButtons[1])
    expect(onEdit).toHaveBeenCalledWith(1)
    await userEvent.click(editButtons[2])
    expect(onEdit).toHaveBeenCalledWith(2)
  })

  it('calls onSubmit when clicking place order', async () => {
    const onSubmit = vi.fn()
    render(<Step4 data={baseData} onSubmit={onSubmit} onEdit={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /place order/i }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('shows discount and gift wrap in totals', () => {
    const data = {
      ...baseData,
      preferences: { ...baseData.preferences, promoCode: 'SAVE20', giftWrap: true },
    }
    render(<Step4 data={data} onSubmit={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText('-$20.00')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
    expect(screen.getByText('$84.99')).toBeInTheDocument()
  })

  it('shows delivery instructions and promo when present', () => {
    const data = {
      ...baseData,
      preferences: { ...baseData.preferences, deliveryInstructions: 'Leave at door', promoCode: 'HALF' },
    }
    render(<Step4 data={data} onSubmit={vi.fn()} onEdit={vi.fn()} />)
    expect(screen.getByText(/instructions: leave at door/i)).toBeInTheDocument()
    expect(screen.getByText(/promo: half/i)).toBeInTheDocument()
  })
})
