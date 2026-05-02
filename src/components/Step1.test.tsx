import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Step1 } from './Step1'

describe('Step1', () => {
  it('renders inputs and calls onChange', () => {
    const onChange = vi.fn()
    render(
      <Step1
        data={{ firstName: '', lastName: '', email: '', phone: '' }}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('First Name'), { target: { value: 'Jane' } })
    expect(onChange).toHaveBeenLastCalledWith('firstName', 'Jane')

    fireEvent.change(screen.getByLabelText('Last Name'), { target: { value: 'Doe' } })
    expect(onChange).toHaveBeenLastCalledWith('lastName', 'Doe')

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jane@example.com' } })
    expect(onChange).toHaveBeenLastCalledWith('email', 'jane@example.com')

    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '+1234567890' } })
    expect(onChange).toHaveBeenLastCalledWith('phone', '+1234567890')
  })

  it('shows error styles for invalid but non-empty fields', () => {
    const onChange = vi.fn()
    render(
      <Step1
        data={{ firstName: 'J', lastName: 'D', email: 'bad', phone: 'abc' }}
        onChange={onChange}
      />,
    )

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Phone')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument()
    expect(screen.getByText(/please enter a valid phone/i)).toBeInTheDocument()
  })

  it('does not show error messages for empty fields', () => {
    render(
      <Step1
        data={{ firstName: '', lastName: '', email: '', phone: '' }}
        onChange={vi.fn()}
      />,
    )
    expect(screen.queryByText(/please enter a valid/i)).not.toBeInTheDocument()
  })
})
