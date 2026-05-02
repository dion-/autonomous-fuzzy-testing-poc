import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Step2 } from './Step2'

describe('Step2', () => {
  it('renders fields and calls onChange', () => {
    const onChange = vi.fn()
    render(
      <Step2
        data={{ country: '', address: '', city: '', state: '', postalCode: '' }}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByLabelText('Country'), { target: { value: 'US' } })
    expect(onChange).toHaveBeenLastCalledWith('country', 'US')

    fireEvent.change(screen.getByLabelText('Street Address'), { target: { value: '123 Main' } })
    expect(onChange).toHaveBeenLastCalledWith('address', '123 Main')

    fireEvent.change(screen.getByLabelText('City'), { target: { value: 'SF' } })
    expect(onChange).toHaveBeenLastCalledWith('city', 'SF')

    fireEvent.change(screen.getByLabelText('State / Province / Region'), { target: { value: 'CA' } })
    expect(onChange).toHaveBeenLastCalledWith('state', 'CA')

    fireEvent.change(screen.getByLabelText('Postal Code'), { target: { value: '12345' } })
    expect(onChange).toHaveBeenLastCalledWith('postalCode', '12345')
  })

  it('validates US postal code', () => {
    const onChange = vi.fn()
    render(
      <Step2
        data={{ country: 'US', address: '123', city: 'SF', state: 'CA', postalCode: '1234' }}
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText('Postal Code')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/please enter a valid postal code/i)).toBeInTheDocument()
  })

  it('validates Canadian postal code', () => {
    const onChange = vi.fn()
    render(
      <Step2
        data={{ country: 'CA', address: '123', city: 'SF', state: 'CA', postalCode: '12345' }}
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText('Postal Code')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/please enter a valid postal code/i)).toBeInTheDocument()
  })

  it('validates UK postal code', () => {
    const onChange = vi.fn()
    render(
      <Step2
        data={{ country: 'UK', address: '123', city: 'SF', state: 'CA', postalCode: '12345' }}
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText('Postal Code')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText(/please enter a valid postal code/i)).toBeInTheDocument()
  })

  it('accepts any non-empty postal code for other countries', () => {
    const onChange = vi.fn()
    render(
      <Step2
        data={{ country: 'DE', address: '123', city: 'SF', state: 'CA', postalCode: 'abc' }}
        onChange={onChange}
      />,
    )
    expect(screen.getByLabelText('Postal Code')).toHaveAttribute('aria-invalid', 'false')
    expect(screen.queryByText(/please enter a valid postal code/i)).not.toBeInTheDocument()
  })

  it('does not show error messages for empty fields', () => {
    render(
      <Step2
        data={{ country: '', address: '', city: '', state: '', postalCode: '' }}
        onChange={vi.fn()}
      />,
    )
    expect(screen.queryByText(/please enter a valid/i)).not.toBeInTheDocument()
  })
})
