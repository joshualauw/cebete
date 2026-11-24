import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MoodEntryItem from '@/mood/MoodEntryItem'
import { deleteMoodEntry } from '@/mood/repository'
import type { MoodEntry } from '@/mood/types'
import { renderWithProviders } from '@tests/helpers/render'

// Replace the real delete, so the tests can make it fail the way a blocked storage would.
vi.mock('@/mood/repository', () => ({ deleteMoodEntry: vi.fn() }))

const deleteFn = vi.mocked(deleteMoodEntry)

const entry: MoodEntry = { id: 7, emotions: [{ emotion: 'sad', intensity: 4 }], createdAt: 1_000 }

function renderItem(onDeleted: () => void): void {
  renderWithProviders(<MoodEntryItem entry={entry} onDeleted={onDeleted} />)
}

function askToDelete(): void {
  fireEvent.click(screen.getByRole('button', { name: /^Delete the Sad entry from/ }))
}

afterEach(() => {
  vi.restoreAllMocks()
  deleteFn.mockReset()
})

describe('MoodEntryItem: when deleting fails', () => {
  it('shows a calm message, and keeps the entry and the question', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deleteFn.mockRejectedValueOnce(new Error('storage unavailable'))
    const onDeleted = vi.fn()
    renderItem(onDeleted)

    askToDelete()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be deleted/i)
    expect(onDeleted).not.toHaveBeenCalled()
    expect(screen.getByText('Sad')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeEnabled()
    expect(report).toHaveBeenCalled()
  })

  it('lets the user try again, and finishes once the retry works', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deleteFn.mockRejectedValueOnce(new Error('storage unavailable'))
    deleteFn.mockResolvedValueOnce(undefined)
    const onDeleted = vi.fn()
    renderItem(onDeleted)

    askToDelete()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledOnce()
    })
    expect(deleteFn).toHaveBeenCalledTimes(2)
    expect(deleteFn).toHaveBeenCalledWith(entry.id)
  })

  it('clears the message when the user backs out', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    deleteFn.mockRejectedValueOnce(new Error('storage unavailable'))
    renderItem(() => undefined)

    askToDelete()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    await screen.findByRole('alert')

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    askToDelete()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('disables both choices while the delete is under way', async () => {
    deleteFn.mockReturnValueOnce(new Promise(() => undefined))
    renderItem(() => undefined)

    askToDelete()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    const busy = await screen.findByRole('button', { name: 'Deleting…' })

    expect(busy).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeDisabled()
  })
})
