import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import CopingList from '@/coping/CopingList'
import { renderWithProviders } from '@tests/helpers/render'

// Make reading the items fail, as it would if the browser blocked its storage.
vi.mock('@/coping/repository', () => ({
  listCopingItems: vi.fn().mockRejectedValue(new Error('storage unavailable')),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CopingList: when the items cannot be loaded', () => {
  it('shows a calm message, and the rest of the screen keeps working', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(
      <>
        <h1>Coping library</h1>
        <CopingList />
      </>,
    )

    const message = await screen.findByRole('status')

    expect(message).toHaveTextContent(/could not be loaded/i)
    expect(screen.getByRole('heading', { name: 'Coping library' })).toBeInTheDocument()
    expect(screen.queryByText(/no items yet/i)).not.toBeInTheDocument()
    expect(report).toHaveBeenCalled()
  })
})
