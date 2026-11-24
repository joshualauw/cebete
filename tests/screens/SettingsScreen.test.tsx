import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SettingsScreen from '@/screens/SettingsScreen'
import { renderWithProviders } from '@tests/helpers/render'

describe('SettingsScreen', () => {
  it('has the Settings heading, and no longer says "coming soon"', () => {
    renderWithProviders(<SettingsScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'Settings' })).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })

  it('has a Backup section that explains why a backup matters', () => {
    renderWithProviders(<SettingsScreen />)

    const backup = screen.getByRole('region', { name: 'Backup' })

    expect(within(backup).getByRole('heading', { level: 2, name: 'Backup' })).toBeInTheDocument()
    expect(within(backup).getByText(/stays on this device only/i)).toBeInTheDocument()
    expect(within(backup).getByText(/clear your browser data or change phone/i)).toBeInTheDocument()
  })

  it('lets the user export a backup from the Backup section', () => {
    renderWithProviders(<SettingsScreen />)

    const backup = screen.getByRole('region', { name: 'Backup' })

    expect(within(backup).getByRole('button', { name: 'Export backup' })).toBeInTheDocument()
  })

  it('lets the user import a backup from the Backup section, under its own heading', () => {
    renderWithProviders(<SettingsScreen />)

    const backup = screen.getByRole('region', { name: 'Backup' })

    expect(
      within(backup).getByRole('heading', { level: 3, name: 'Save a copy' }),
    ).toBeInTheDocument()
    expect(
      within(backup).getByRole('heading', { level: 3, name: 'Restore from a copy' }),
    ).toBeInTheDocument()
    expect(within(backup).getByRole('button', { name: 'Import backup' })).toBeInTheDocument()
  })
})
