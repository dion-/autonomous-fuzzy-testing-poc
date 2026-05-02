import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Navigation } from './Navigation'

describe('Navigation', () => {
  it('renders all steps', () => {
    render(
      <Navigation
        currentStep={0}
        totalSteps={4}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkipTo={vi.fn()}
        canProceed
      />,
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('list')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(4)
  })

  it('marks the current step with aria-current', () => {
    render(
      <Navigation
        currentStep={1}
        totalSteps={4}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkipTo={vi.fn()}
        canProceed
      />,
    )
    expect(screen.getByRole('button', { current: 'step' })).toBeInTheDocument()
  })

  it('shows checkmark for completed steps', () => {
    render(
      <Navigation
        currentStep={2}
        totalSteps={4}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkipTo={vi.fn()}
        canProceed
      />,
    )
    const buttons = screen.getAllByRole('button')
    expect(buttons[0].querySelector('svg')).toBeInTheDocument()
    expect(buttons[1].querySelector('svg')).toBeInTheDocument()
  })

  it('calls onSkipTo when clicking a step', async () => {
    const onSkipTo = vi.fn()
    render(
      <Navigation
        currentStep={0}
        totalSteps={4}
        onNext={vi.fn()}
        onBack={vi.fn()}
        onSkipTo={onSkipTo}
        canProceed
      />,
    )
    const buttons = screen.getAllByRole('button')
    await userEvent.click(buttons[2])
    expect(onSkipTo).toHaveBeenCalledWith(2)
  })
})
