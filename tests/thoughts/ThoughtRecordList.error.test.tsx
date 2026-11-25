import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { renderWithProviders } from '@tests/helpers/render'

vi.mock('@/thoughts/repository', () => ({
  listThoughtRecords: vi.fn().mockRejectedValue(new Error('storage unavailable')),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ThoughtsScreen: when the records cannot be loaded', () => {
  it('shows a calm message, and the rest of the screen keeps working', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<ThoughtsScreen />)

    expect(await screen.findByRole('status')).toHaveTextContent(/could not be loaded/i)
    expect(screen.getByRole('heading', { level: 1, name: 'Thoughts' })).toBeInTheDocument()
    expect(screen.queryByText(/no thought records yet/i)).not.toBeInTheDocument()
    expect(report).toHaveBeenCalled()
  })
})
