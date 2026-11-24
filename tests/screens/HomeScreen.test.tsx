import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import HomeScreen from '@/screens/HomeScreen'
import { renderWithProviders } from '@tests/helpers/render'

describe('HomeScreen', () => {
  it('shows the app name and a friendly welcome message', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('tells the user their data stays on their device', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByText(/kept on your device/i)).toBeInTheDocument()
  })
})
