import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkerAccess } from '../../../components/auth/WorkerAccess'

describe('WorkerAccess', () => {
  it('calls token validation when the access button is pressed', async () => {
    const onValidateToken = vi.fn().mockResolvedValue(undefined)

    render(
      <WorkerAccess token='worker-token-123' onValidateToken={onValidateToken} isLoading={false} />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Access Dashboard' }))

    await waitFor(() => {
      expect(onValidateToken).toHaveBeenCalledWith('worker-token-123')
    })
  })

  it('renders the expired state for expired links', () => {
    render(
      <WorkerAccess
        token='worker-token-123'
        onValidateToken={vi.fn().mockResolvedValue(undefined)}
        error='token expired'
      />
    )

    expect(screen.getByText('Link Expired')).toBeInTheDocument()
    expect(
      screen.getByText('This link has expired. Ask your manager to send you a new one.')
    ).toBeInTheDocument()
  })

  it('renders the invalid state for unusable links', () => {
    render(
      <WorkerAccess
        token='worker-token-123'
        onValidateToken={vi.fn().mockResolvedValue(undefined)}
        error='invalid token'
      />
    )

    expect(screen.getByText('Invalid Link')).toBeInTheDocument()
    expect(
      screen.getByText('This link is invalid or has been used. Ask your manager to send you a new one.')
    ).toBeInTheDocument()
  })
})
