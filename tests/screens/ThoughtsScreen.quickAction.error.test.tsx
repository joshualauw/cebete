import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { openFormRequest } from '@/navigation/openForm'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { renderWithProviders } from '@tests/helpers/render'

// Make reading the records fail, as it would if the browser blocked its storage.
vi.mock('@/thoughts/repository', () => ({
  listThoughtRecords: vi.fn().mockRejectedValue(new Error('storage unavailable')),
  addThoughtRecord: vi.fn(),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ThoughtsScreen: opened by a quick action when the records cannot be loaded', () => {
  it('still opens the capture, and shows the calm message under it', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<ThoughtsScreen />, { pathname: '/thoughts', state: openFormRequest })

    expect(screen.getByRole('region', { name: 'New thought record' })).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent(/could not be loaded/i)
  })
})
