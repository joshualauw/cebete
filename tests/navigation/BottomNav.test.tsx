import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import BottomNav from '@/navigation/BottomNav'
import { renderWithProviders } from '@tests/helpers/render'

function currentSections(): (string | null)[] {
  return screen
    .getAllByRole('link')
    .filter((link) => link.getAttribute('aria-current') === 'page')
    .map((link) => link.textContent)
}

describe('BottomNav', () => {
  it('is a labelled navigation landmark', () => {
    renderWithProviders(<BottomNav />)

    expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
  })

  it('offers Home, Mood, Thoughts and Settings, in that order', () => {
    renderWithProviders(<BottomNav />)

    const links = within(screen.getByRole('navigation', { name: 'Main' })).getAllByRole('link')

    expect(links.map((link) => link.textContent)).toEqual(['Home', 'Mood', 'Thoughts', 'Settings'])
  })

  it('points each item at its own section address', () => {
    renderWithProviders(<BottomNav />)

    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Mood' })).toHaveAttribute('href', '/mood')
    expect(screen.getByRole('link', { name: 'Thoughts' })).toHaveAttribute('href', '/thoughts')
    expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', '/settings')
  })

  it.each([
    ['/', 'Home'],
    ['/mood', 'Mood'],
    ['/thoughts', 'Thoughts'],
    ['/settings', 'Settings'],
  ])('marks only the current section as current at %s', (route, section) => {
    renderWithProviders(<BottomNav />, route)

    expect(currentSections()).toEqual([section])
  })

  it('does not treat Home as current on another section', () => {
    renderWithProviders(<BottomNav />, '/mood')

    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('keeps the decorative icons away from assistive technology', () => {
    renderWithProviders(<BottomNav />)

    const icons = screen.getByRole('navigation', { name: 'Main' }).querySelectorAll('svg')

    expect(icons).toHaveLength(4)
    for (const icon of icons) {
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
