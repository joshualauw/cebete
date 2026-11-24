import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MoodList from '@/mood/MoodList'
import { renderWithProviders } from '@tests/helpers/render'

// Make reading the entries fail, as it would if the browser blocked its storage.
vi.mock('@/mood/repository', () => ({
  listMoodEntries: vi.fn().mockRejectedValue(new Error('storage unavailable')),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MoodList: when the entries cannot be loaded', () => {
  it('shows a calm message, and the rest of the screen keeps working', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(
      <>
        <h1>Mood</h1>
        <MoodList />
      </>,
    )

    const message = await screen.findByRole('status')

    expect(message).toHaveTextContent(/could not be loaded/i)
    expect(screen.getByRole('heading', { name: 'Mood' })).toBeInTheDocument()
    expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()
    expect(report).toHaveBeenCalled()
  })
})
