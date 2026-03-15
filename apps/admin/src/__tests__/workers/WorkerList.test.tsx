import type { Worker } from '@dashboard-link/shared'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkerList } from '../../components/workers/WorkerList'

const activeWorker: Worker = {
  id: 'worker-1',
  organizationId: 'org-1',
  name: 'John Smith',
  phone: '+61412345678',
  email: 'john@example.com',
  active: true,
  deletedAt: null,
  metadata: {},
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-11T10:00:00.000Z',
}

const inactiveWorker: Worker = {
  ...activeWorker,
  id: 'worker-2',
  name: 'Jane Inactive',
  phone: '+61498765432',
  deletedAt: '2026-03-12T10:00:00.000Z',
}

describe('WorkerList', () => {
  it('renders worker cards', () => {
    render(
      <WorkerList
        workers={[activeWorker, inactiveWorker]}
        isLoading={false}
        error={null}
        onEdit={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    )

    expect(screen.getByText('John Smith')).toBeInTheDocument()
    expect(screen.getByText('Jane Inactive')).toBeInTheDocument()
    expect(screen.getByText('0412 345 678')).toBeInTheDocument()
    expect(screen.getByText('0498 765 432')).toBeInTheDocument()
  })

  it('displays the empty state when there are no workers', () => {
    render(
      <WorkerList
        workers={[]}
        isLoading={false}
        error={null}
        onEdit={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    )

    expect(
      screen.getByText('No workers yet. Add your first worker to get started.')
    ).toBeInTheDocument()
  })

  it('shows a loading state', () => {
    const { container } = render(
      <WorkerList
        workers={[]}
        isLoading
        error={null}
        onEdit={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    )

    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows an error state with retry action', () => {
    const onRetry = vi.fn()

    render(
      <WorkerList
        workers={[]}
        isLoading={false}
        error={new Error('Network unavailable')}
        onEdit={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(undefined)}
        onRetry={onRetry}
      />
    )

    expect(screen.getByText('Error loading workers')).toBeInTheDocument()
    expect(screen.getByText('Network unavailable')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('shows the inactive badge for deleted workers', () => {
    render(
      <WorkerList
        workers={[inactiveWorker]}
        isLoading={false}
        error={null}
        onEdit={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(undefined)}
      />
    )

    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })

  it('opens delete dialog and confirms deletion through callback', async () => {
    const onDelete = vi.fn().mockResolvedValue(undefined)

    render(
      <WorkerList
        workers={[activeWorker]}
        isLoading={false}
        error={null}
        onEdit={vi.fn()}
        onDelete={onDelete}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.getByRole('heading', { name: 'Delete Worker' })).toBeInTheDocument()
    expect(
      screen.getByText('Delete John Smith? Historical data will be preserved.')
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Delete Worker' }))

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(activeWorker)
    })
  })
})
