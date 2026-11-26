import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { InitialEntry } from 'react-router'

import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import { openFormRequest } from '@/navigation/openForm'
import MoodScreen from '@/screens/MoodScreen'
import { LocationProbe } from '@tests/helpers/locationProbe'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

const REQUESTED: InitialEntry = { pathname: '/mood', state: openFormRequest }

beforeEach(async () => {
  await db.moodEntries.clear()
})

function renderMood(route: InitialEntry = '/mood'): void {
  renderWithProviders(
    <>
      <MoodScreen />
      <LocationProbe />
    </>,
    route,
  )
}

describe('MoodScreen: opened by a quick action', () => {
  it('starts with the new-entry form open, and focus in it', () => {
    renderMood(REQUESTED)

    expect(screen.getByRole('heading', { name: 'New entry' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Add entry' })).not.toBeInTheDocument()
  })

  it('shows the list below the form', async () => {
    await addMoodEntry(oneEmotion('hopeful', 6))

    renderMood(REQUESTED)

    expect(screen.getByRole('heading', { name: 'New entry' })).toBeInTheDocument()
    expect(await screen.findByText('Hopeful')).toBeInTheDocument()
  })

  it('has the form ready even while the list is still loading', () => {
    renderMood(REQUESTED)

    expect(screen.getByRole('heading', { name: 'New entry' })).toBeInTheDocument()
    expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()
  })

  it('uses the request once: the history note is cleared, and the address stays', async () => {
    renderMood(REQUESTED)

    await waitFor(() => {
      expect(screen.getByTestId('history-note')).toHaveTextContent('null')
    })
    expect(screen.getByTestId('pathname')).toHaveTextContent('/mood')
    expect(screen.getByRole('heading', { name: 'New entry' })).toBeInTheDocument()
  })

  it('closes on Cancel, leaves the user on Mood, and gives focus back to Add entry', async () => {
    await addMoodEntry(oneEmotion('hopeful', 6))
    renderMood(REQUESTED)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toHaveFocus()
    expect(screen.getByTestId('pathname')).toHaveTextContent('/mood')
    expect(await screen.findByText('Hopeful')).toBeInTheDocument()
    expect(await db.moodEntries.count()).toBe(1)
  })

  it('saves an entry exactly as when the form was opened by hand', async () => {
    renderMood(REQUESTED)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Calm')).toBeInTheDocument()
    expect(await db.moodEntries.count()).toBe(1)
    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
  })
})

describe('MoodScreen: opened in the ordinary ways', () => {
  it('shows no form when opened by its address', async () => {
    renderMood('/mood')

    expect(screen.getByRole('button', { name: 'Add entry' })).toBeEnabled()
    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
    await screen.findByText(/no entries yet/i)
  })

  it('shows no form for a history note that does not ask for one', () => {
    renderMood({ pathname: '/mood', state: { deleted: true } })

    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
  })

  it('leaves the history note alone when no form was asked for', () => {
    renderMood({ pathname: '/mood', state: { deleted: true } })

    expect(screen.getByTestId('history-note')).toHaveTextContent('{"deleted":true}')
  })
})
