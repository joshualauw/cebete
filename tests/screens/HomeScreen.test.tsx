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

  it('shows a calm "Need to settle?" card that links to the quick settle screen', () => {
    renderWithProviders(<HomeScreen />)

    const card = screen.getByRole('link', { name: 'Need to settle?' })

    expect(card).toHaveAttribute('href', '/settle')
    expect(card).toHaveAccessibleDescription(/a few taps away/i)
  })

  it('offers a link to the coping library', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByRole('link', { name: 'My coping library' })).toHaveAttribute(
      'href',
      '/coping',
    )
  })

  it('tells the user their data stays on their device', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByText(/kept on your device/i)).toBeInTheDocument()
  })
})
