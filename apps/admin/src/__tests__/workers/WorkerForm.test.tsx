import type { Worker } from '@dashboard-link/shared'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WorkerForm } from '../../components/workers/WorkerForm'

const createWorkerMutateAsync = vi.fn()
const updateWorkerMutateAsync = vi.fn()

vi.mock('../../hooks/useWorkers', () => ({
  useWorkerMutations: () => ({
    createWorker: {
      mutateAsync: createWorkerMutateAsync,
    },
    updateWorker: {
      mutateAsync: updateWorkerMutateAsync,
    },
  }),
}))

const baseWorker: Worker = {
  id: 'worker-1',
  organizationId: 'org-1',
  name: 'Jane Smith',
  phone: '+61412345678',
  email: 'jane@example.com',
  active: true,
  deletedAt: null,
  metadata: {},
  createdAt: '2026-03-10T10:00:00.000Z',
  updatedAt: '2026-03-11T10:00:00.000Z',
}

describe('WorkerForm', () => {
  it('shows inline validation errors and preserves user input on validation failure', async () => {
    render(<WorkerForm />)

    const nameInput = screen.getByLabelText('Name')
    const phoneInput = screen.getByLabelText('Phone Number')

    fireEvent.change(nameInput, { target: { value: '   ' } })
    fireEvent.change(phoneInput, { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Worker' }))

    expect(await screen.findByText('Name cannot be empty')).toBeInTheDocument()
    expect(
      screen.getByText('Invalid Australian mobile number (e.g., 0412 345 678)')
    ).toBeInTheDocument()
    expect(nameInput).toHaveValue('   ')
    expect(phoneInput).toHaveValue('123')
    expect(createWorkerMutateAsync).not.toHaveBeenCalled()
  })

  it('validates phone format before submitting', async () => {
    render(<WorkerForm />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John Smith' } })
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '0399 123 456' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Worker' }))

    expect(
      await screen.findByText('Invalid Australian mobile number (e.g., 0412 345 678)')
    ).toBeInTheDocument()
    expect(createWorkerMutateAsync).not.toHaveBeenCalled()
  })

  it('validates name length before submitting', async () => {
    render(<WorkerForm />)

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'a'.repeat(256) } })
    fireEvent.change(screen.getByLabelText('Phone Number'), { target: { value: '0412 345 678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Worker' }))

    expect(await screen.findByText('Name must be 255 characters or less')).toBeInTheDocument()
    expect(createWorkerMutateAsync).not.toHaveBeenCalled()
  })

  it('submits successfully in create mode and resets the form', async () => {
    createWorkerMutateAsync.mockResolvedValueOnce({
      worker: baseWorker,
    })

    render(<WorkerForm />)

    const nameInput = screen.getByLabelText('Name')
    const phoneInput = screen.getByLabelText('Phone Number')

    fireEvent.change(nameInput, { target: { value: 'John Smith' } })
    fireEvent.change(phoneInput, { target: { value: '0412 345 678' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add Worker' }))

    await waitFor(() => {
      expect(createWorkerMutateAsync).toHaveBeenCalledWith({
        name: 'John Smith',
        phone: '0412 345 678',
      })
    })

    await waitFor(() => {
      expect(nameInput).toHaveValue('')
      expect(phoneInput).toHaveValue('')
    })
  })

  it('populates edit mode values and submits update payload', async () => {
    updateWorkerMutateAsync.mockResolvedValueOnce(baseWorker)

    render(<WorkerForm worker={baseWorker} />)

    const nameInput = screen.getByLabelText('Name')
    const phoneInput = screen.getByLabelText('Phone Number')

    expect(nameInput).toHaveValue('Jane Smith')
    expect(phoneInput).toHaveValue('0412 345 678')
    expect(screen.getByRole('button', { name: 'Update Worker' })).toBeInTheDocument()

    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } })
    fireEvent.click(screen.getByRole('button', { name: 'Update Worker' }))

    await waitFor(() => {
      expect(updateWorkerMutateAsync).toHaveBeenCalledWith({
        id: 'worker-1',
        data: {
          name: 'Jane Doe',
          phone: '0412 345 678',
          updatedAt: '2026-03-11T10:00:00.000Z',
        },
      })
    })
  })
})
