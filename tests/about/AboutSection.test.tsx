import { screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { APP_VERSION } from '@/about/version'
import SettingsScreen from '@/screens/SettingsScreen'
import { renderWithProviders } from '@tests/helpers/render'

describe('Settings: About', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows an About section below Backup', () => {
    renderWithProviders(<SettingsScreen />)

    const backup = screen.getByRole('region', { name: 'Backup' })
    const about = screen.getByRole('region', { name: 'About' })

    expect(within(about).getByRole('heading', { level: 2, name: 'About' })).toBeInTheDocument()
    expect(backup.compareDocumentPosition(about) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the app name and its version', () => {
    renderWithProviders(<SettingsScreen />)

    const about = screen.getByRole('region', { name: 'About' })

    expect(within(about).getByText(`cebete, version ${APP_VERSION}`)).toBeInTheDocument()
    expect(APP_VERSION).not.toBe('')
  })

  it('says everything stays on the device, with no analytics, and that backups are plain text', () => {
    renderWithProviders(<SettingsScreen />)

    const about = screen.getByRole('region', { name: 'About' })

    expect(within(about).getByText(/everything you record stays on this device/i)).toBeVisible()
    expect(within(about).getByText(/sends nothing anywhere and has no analytics/i)).toBeVisible()
    expect(within(about).getByText(/backup files are plain text, so keep them safe/i)).toBeVisible()
  })

  it('says cebete is a self-help tool, not a substitute for professional care or emergency help', () => {
    renderWithProviders(<SettingsScreen />)

    const about = screen.getByRole('region', { name: 'About' })

    expect(within(about).getByText(/self-help tool/i)).toBeVisible()
    expect(
      within(about).getByText(/not a substitute for professional care or emergency help/i),
    ).toBeVisible()
  })

  it('has no link, so nothing in it needs a connection', () => {
    renderWithProviders(<SettingsScreen />)

    expect(within(screen.getByRole('region', { name: 'About' })).queryByRole('link')).toBeNull()
  })

  it('asks the network for nothing when it shows', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    renderWithProviders(<SettingsScreen />)

    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('leaves the Backup section as it was', () => {
    renderWithProviders(<SettingsScreen />)

    const backup = screen.getByRole('region', { name: 'Backup' })

    expect(within(backup).getByRole('button', { name: 'Export backup' })).toBeInTheDocument()
    expect(within(backup).queryByText(/cebete, version/i)).toBeNull()
  })
})
