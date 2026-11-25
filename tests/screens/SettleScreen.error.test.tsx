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
  it('still shows the built-in techniques, with a calm message', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<SettleScreen />)

    const message = await screen.findByRole('status')

    expect(message).toHaveTextContent(/could not be loaded right now/i)
    expect(message).toHaveTextContent(/built-in techniques are still here/i)
    expect(screen.getByRole('heading', { level: 3, name: 'Slow breathing' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit my coping library' })).toBeInTheDocument()
    expect(report).toHaveBeenCalled()
  })

  it('does not tell the user their library is empty, since that is not known', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<SettleScreen />)

    await screen.findByRole('status')

    expect(screen.queryByText(/add the things that help you/i)).not.toBeInTheDocument()
  })
})
