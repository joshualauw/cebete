import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import SettleScreen from '@/screens/SettleScreen'
import { renderWithProviders } from '@tests/helpers/render'

// Make reading the items fail, as it would if the browser blocked its storage.
vi.mock('@/coping/repository', () => ({
  listCopingItems: vi.fn().mockRejectedValue(new Error('storage unavailable')),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SettleScreen: when the user’s items cannot be loaded', () => {
  it('shows only a calm message, with no technique of any kind', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<SettleScreen />)

    const message = await screen.findByRole('status')

    expect(message).toHaveTextContent(/could not be loaded right now/i)
    expect(message).not.toHaveTextContent(/built-in/i)
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(screen.queryByText(/slow breathing/i)).not.toBeInTheDocument()
    expect(report).toHaveBeenCalled()
  })

  it('keeps the way back and the way to the library, and the calm note', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<SettleScreen />)

    await screen.findByRole('status')

    expect(screen.getByRole('link', { name: 'Back to home' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit my coping library' })).toBeInTheDocument()
    expect(screen.getByText(/self-help tool/i)).toBeInTheDocument()
  })

  it('does not tell the user their library is empty, since that is not known', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<SettleScreen />)

    await screen.findByRole('status')

    expect(screen.queryByText(/add the things that help you/i)).not.toBeInTheDocument()
  })
})
