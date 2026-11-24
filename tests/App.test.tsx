import { fireEvent, screen, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useLocation } from 'react-router'
import { describe, expect, it } from 'vitest'

import App from '@/App'
import { renderWithProviders } from '@tests/helpers/render'

/** Shows the current address, so tests can see where the app ended up. */
function CurrentAddress(): ReactElement {
  const { pathname } = useLocation()

  return <p data-testid="address">{pathname}</p>
}

function renderAppAt(route: string): void {
  renderWithProviders(
    <>
      <App />
      <CurrentAddress />
    </>,
    route,
  )
}

describe('App sections', () => {
  it('shows the home screen at the root address', () => {
    renderAppAt('/')

    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
  })

  it('opens straight onto the Mood section when the page is loaded there', async () => {
    renderAppAt('/mood')

    expect(screen.getByRole('heading', { level: 1, name: 'Mood' })).toBeInTheDocument()
    expect(screen.getByTestId('address')).toHaveTextContent('/mood')
    // The mood log has its own screen now, not the placeholder.
    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('opens straight onto the Settings section when the page is loaded there', () => {
    renderAppAt('/settings')

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Backup' })).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
    expect(screen.getByTestId('address')).toHaveTextContent('/settings')
  })

  it('does not show the other sections', () => {
    renderAppAt('/mood')

    expect(screen.queryByRole('heading', { name: 'cebete' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Settings' })).not.toBeInTheDocument()
  })

  it.each(['/', '/mood', '/settings', '/nowhere'])(
    'shows the bottom bar on every screen, including %s',
    (route) => {
      renderAppAt(route)

      const bar = screen.getByRole('navigation', { name: 'Main' })

      expect(within(bar).getAllByRole('link')).toHaveLength(3)
    },
  )

  it('opens a section when its bar item is tapped, and highlights it', () => {
    renderAppAt('/')

    fireEvent.click(screen.getByRole('link', { name: 'Mood' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Mood' })).toBeInTheDocument()
    expect(screen.getByTestId('address')).toHaveTextContent(/^\/mood$/)
    expect(screen.getByRole('link', { name: 'Mood' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('moves between every section from the bar', () => {
    renderAppAt('/')

    fireEvent.click(screen.getByRole('link', { name: 'Settings' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Mood' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Mood' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Home' }))
    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
    expect(screen.getByTestId('address')).toHaveTextContent(/^\/$/)
  })

  it.each(['/nowhere', '/mood/extra', '/settings/anything/else'])(
    'sends the unknown address %s to the home screen',
    (route) => {
      renderAppAt(route)

      expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
      expect(screen.getByTestId('address')).toHaveTextContent(/^\/$/)
    },
  )
})
