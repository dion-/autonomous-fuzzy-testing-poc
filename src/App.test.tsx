import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders step 1 initially with next disabled', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Checkout')
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('enables next after filling valid personal info and proceeds through steps', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText('First Name'), 'Jane')
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '+1234567890')

    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).toBeEnabled()
    await userEvent.click(nextBtn)

    expect(screen.getByLabelText('Country')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Country'), 'US')
    await userEvent.type(screen.getByLabelText('Street Address'), '123 Main')
    await userEvent.type(screen.getByLabelText('City'), 'SF')
    await userEvent.type(screen.getByLabelText('State / Province / Region'), 'CA')
    await userEvent.type(screen.getByLabelText('Postal Code'), '12345')

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByRole('checkbox', { name: /subscribe to newsletter/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
  })

  it('navigates back and forth with back button', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText('First Name'), 'Jane')
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '+1234567890')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByLabelText('Country')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /back/i }))
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(screen.getByLabelText('Country')).toBeInTheDocument()
  })

  it('skips to a step using navigation sidebar', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText('First Name'), 'Jane')
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '+1234567890')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    const navButtons = screen.getAllByRole('button')
    // Click the first nav button (Personal) to go back to step 0
    await userEvent.click(navButtons[0])
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
  })

  it('opens and closes terms modal', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /terms/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('clears draft and resets to step 0', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText('First Name'), 'Jane')
    await userEvent.click(screen.getByRole('button', { name: /clear draft/i }))
    expect(screen.getByLabelText('First Name')).toHaveValue('')
  })

  it('submits order and shows success screen, then starts new order', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText('First Name'), 'Jane')
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '+1234567890')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    await userEvent.selectOptions(screen.getByLabelText('Country'), 'US')
    await userEvent.type(screen.getByLabelText('Street Address'), '123 Main')
    await userEvent.type(screen.getByLabelText('City'), 'SF')
    await userEvent.type(screen.getByLabelText('State / Province / Region'), 'CA')
    await userEvent.type(screen.getByLabelText('Postal Code'), '12345')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    // Click the first Place Order button (there are two on the review step)
    await userEvent.click(screen.getAllByRole('button', { name: /place order/i })[0])
    expect(screen.getByText('Order Placed')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /start new order/i }))
    expect(screen.getByLabelText('First Name')).toBeInTheDocument()
  })

  it('allows editing from review step', async () => {
    render(<App />)
    await userEvent.type(screen.getByLabelText('First Name'), 'Jane')
    await userEvent.type(screen.getByLabelText('Last Name'), 'Doe')
    await userEvent.type(screen.getByLabelText('Email'), 'jane@example.com')
    await userEvent.type(screen.getByLabelText('Phone'), '+1234567890')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    await userEvent.selectOptions(screen.getByLabelText('Country'), 'US')
    await userEvent.type(screen.getByLabelText('Street Address'), '123 Main')
    await userEvent.type(screen.getByLabelText('City'), 'SF')
    await userEvent.type(screen.getByLabelText('State / Province / Region'), 'CA')
    await userEvent.type(screen.getByLabelText('Postal Code'), '12345')
    await userEvent.click(screen.getByRole('button', { name: /next/i }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    const editButtons = screen.getAllByRole('button', { name: /edit/i })
    await userEvent.click(editButtons[1])
    expect(screen.getByLabelText('Country')).toBeInTheDocument()
  })

  it('prevents default form submission', () => {
    render(<App />)
    const form = document.querySelector('form')!
    const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
    const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault')
    form.dispatchEvent(submitEvent)
    expect(preventDefaultSpy).toHaveBeenCalled()
  })
})
