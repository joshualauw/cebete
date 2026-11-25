import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import HomeScreen from '@/screens/HomeScreen'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

describe('HomeScreen: the backup reminder', () => {
  beforeEach(async () => {
    await db.moodEntries.clear()
  })

  it('shows no reminder to a new user', async () => {
    renderWithProviders(<HomeScreen />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'My coping library' })).toBeInTheDocument()
    })
    expect(screen.queryByRole('region', { name: 'Backup reminder' })).not.toBeInTheDocument()
  })

  it('shows it below the settle card and above the coping library link when a backup is due', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    renderWithProviders(<HomeScreen />)

    const reminder = await screen.findByRole('region', { name: 'Backup reminder' })
    const settle = screen.getByRole('link', { name: 'Need to settle?' })
    const library = screen.getByRole('link', { name: 'My coping library' })

    expect(settle.compareDocumentPosition(reminder) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      reminder.compareDocumentPosition(library) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('gives focus to the page heading when "Not now" is chosen, since the button goes away', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    renderWithProviders(<HomeScreen />)

    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }))

    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toHaveFocus()
  })
})

describe('HomeScreen', () => {
  it('shows the app name and a friendly welcome message', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('shows a calm "Need to settle?" card that links to the quick settle screen', () => {
    renderWithProviders(<HomeScreen />)

    const card = screen.getByRole('link', { name: 'Need to settle?' })

    expect(card).toHaveAttribute('href', '/settle')
    expect(card).toHaveAccessibleDescription(/a few taps away/i)
  })

  it('offers a link to the coping library', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByRole('link', { name: 'My coping library' })).toHaveAttribute(
      'href',
      '/coping',
    )
  })

  it('tells the user their data stays on their device', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByText(/kept on your device/i)).toBeInTheDocument()
  })
})
