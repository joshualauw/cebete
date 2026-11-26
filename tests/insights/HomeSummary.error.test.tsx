import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import HomeSummary from '@/insights/HomeSummary'
import { renderWithProviders } from '@tests/helpers/render'

// Make reading fail, as it would if the browser blocked its storage.
vi.mock('@/mood/repository', () => ({
  listMoodEntries: vi.fn().mockRejectedValue(new Error('storage unavailable')),
}))
vi.mock('@/thoughts/repository', () => ({
  listThoughtRecords: vi.fn().mockResolvedValue([]),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('the summary panel: when the data cannot be loaded', () => {
  it('shows a calm message, and no chart or empty-state claim', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(
      <>
        <h1>cebete</h1>
        <HomeSummary />
      </>,
    )

    expect(await screen.findByRole('status')).toHaveTextContent(/summary could not be loaded/i)
    expect(screen.getByRole('heading', { name: 'cebete' })).toBeInTheDocument()
    expect(screen.queryByText(/not enough yet/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Most frequent emotions' })).not.toBeInTheDocument()
    expect(report).toHaveBeenCalled()
  })
})
