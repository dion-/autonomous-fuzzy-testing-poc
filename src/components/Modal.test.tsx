import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()} title="Title">
        Content
      </Modal>,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('renders title and children when open', () => {
    render(
      <Modal open onClose={vi.fn()} title="Terms">
        <p>Terms content</p>
      </Modal>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Terms')).toBeInTheDocument()
    expect(screen.getByText('Terms content')).toBeInTheDocument()
  })

  it('calls onClose when clicking the close button', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title">
        Content
      </Modal>,
    )
    await userEvent.click(screen.getByLabelText('Close'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking the backdrop', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title">
        Content
      </Modal>,
    )
    await userEvent.click(screen.getByRole('dialog').previousElementSibling!)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when clicking Got it button', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title">
        Content
      </Modal>,
    )
    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when pressing Escape', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title">
        Content
      </Modal>,
    )
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose for non-Escape keys', async () => {
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} title="Title">
        Content
      </Modal>,
    )
    await userEvent.keyboard('{Enter}')
    expect(onClose).not.toHaveBeenCalled()
  })
})
