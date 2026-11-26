import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { db } from '@/db/db'
import { renderWithProviders } from '@tests/helpers/render'

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
})

function bar(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Main' })
}

describe('the summary on Home, in the whole app', () => {
  it('starts on 7 days at every visit, also after the user chose 30 days and came back', async () => {
    renderWithProviders(<App />)

    fireEvent.click(await screen.findByRole('radio', { name: '30 days' }))
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked()

    fireEvent.click(within(bar()).getByRole('link', { name: 'Mood' }))
    fireEvent.click(within(bar()).getByRole('link', { name: 'Home' }))

    expect(await screen.findByRole('radio', { name: '7 days' })).toBeChecked()
  })

  it('shows a mood entry the user has just added, when they return to Home', async () => {
    renderWithProviders(<App />)
    await screen.findByText(/not enough yet/i)

    fireEvent.click(screen.getByRole('link', { name: 'Log how I feel' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await screen.findByText('Calm')
    fireEvent.click(within(bar()).getByRole('link', { name: 'Home' }))

    expect(
      await screen.findByText('Last 7 days: 1 mood entry, no thought records'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('list', { name: 'Most frequent emotions' })).getByText('Calm'),
    ).toBeInTheDocument()
  })

  it('shows the panel on the Home address and nowhere else', async () => {
    renderWithProviders(<App />, '/mood')

    expect(screen.queryByRole('region', { name: 'Summary' })).not.toBeInTheDocument()
    await screen.findByText(/no entries yet/i)
  })
})
