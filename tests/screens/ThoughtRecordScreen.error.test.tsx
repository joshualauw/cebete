import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { renderWithProviders } from '@tests/helpers/render'

vi.mock('@/thoughts/repository', () => ({
  getThoughtRecord: vi.fn().mockRejectedValue(new Error('storage unavailable')),
  listThoughtRecords: vi.fn().mockResolvedValue([]),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ThoughtRecordScreen: when the record cannot be loaded', () => {
  it('shows a calm message, and the way back keeps working', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    renderWithProviders(<App />, '/thoughts/1')

    expect(await screen.findByRole('status')).toHaveTextContent(/could not be loaded/i)
    expect(screen.getByRole('heading', { level: 1, name: 'Thought record' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to thoughts' })).toBeInTheDocument()
    expect(report).toHaveBeenCalled()
  })
})
