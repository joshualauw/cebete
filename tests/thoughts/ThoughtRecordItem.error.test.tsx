import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { deleteThoughtRecord } from '@/thoughts/repository'
import ThoughtRecordItem from '@/thoughts/ThoughtRecordItem'
import type { ThoughtRecord } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'

vi.mock('@/thoughts/repository', () => ({ deleteThoughtRecord: vi.fn() }))

const deleteFn = vi.mocked(deleteThoughtRecord)

const record: ThoughtRecord = {
  id: 7,
  emotions: [{ emotion: 'sad', intensity: 4 }],
  thought: 'nobody cares',
  belief: 6,
  createdAt: 1_000,
}

function askToDelete(): void {
  fireEvent.click(screen.getByRole('button', { name: /^Delete the thought record/ }))
}

afterEach(() => {
  vi.restoreAllMocks()
  deleteFn.mockReset()
})

describe('ThoughtRecordItem: when deleting fails', () => {
  it('shows a calm message, and keeps the record and the question', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deleteFn.mockRejectedValueOnce(new Error('storage unavailable'))
    const onDeleted = vi.fn()

    renderWithProviders(<ThoughtRecordItem record={record} onDeleted={onDeleted} />)
    askToDelete()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be deleted/i)
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.getByText('nobody cares')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeEnabled()
    expect(report).toHaveBeenCalled()
  })

  it('lets the user try again, and finishes once the retry works', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deleteFn.mockRejectedValueOnce(new Error('storage unavailable'))
    deleteFn.mockResolvedValueOnce(undefined)
    const onDeleted = vi.fn()

    renderWithProviders(<ThoughtRecordItem record={record} onDeleted={onDeleted} />)
    askToDelete()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    await screen.findByRole('alert')
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledOnce()
    })
    expect(deleteFn).toHaveBeenCalledTimes(2)
  })
})
