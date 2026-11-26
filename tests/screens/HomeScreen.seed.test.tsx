import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HomeScreen from '@/screens/HomeScreen'
import { renderWithProviders } from '@tests/helpers/render'

// This test relies on the database being new, with only the starter techniques in it.
describe('HomeScreen: for a brand-new user with only the starter techniques', () => {
  it('shows no backup reminder, since there is nothing of their own to lose', async () => {
    renderWithProviders(<HomeScreen />)

    expect(await screen.findByText(/not enough yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Backup reminder' })).not.toBeInTheDocument()
  })
})
