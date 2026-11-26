import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { openFormRequest } from '@/navigation/openForm'
import MoodScreen from '@/screens/MoodScreen'
import { renderWithProviders } from '@tests/helpers/render'

// Make reading the entries fail, as it would if the browser blocked its storage.
vi.mock('@/mood/repository', () => ({
  listMoodEntries: vi.fn().mockRejectedValue(new Error('storage unavailable')),
  addMoodEntry: vi.fn(),
  updateMoodEntry: vi.fn(),
  deleteMoodEntry: vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MoodScreen: opened by a quick action when the entries cannot be loaded', () => {
  it('still opens the form, and shows the calm message under it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<MoodScreen />, { pathname: '/mood', state: openFormRequest })

    expect(screen.getByRole('heading', { name: 'New entry' })).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent(/could not be loaded/i)
  })
})
