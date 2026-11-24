import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import MoodScreen from '@/screens/MoodScreen'
import { renderWithProviders } from '@tests/helpers/render'
import { oneEmotion } from '@tests/helpers/mood'

beforeEach(async () => {
  await db.moodEntries.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function openForm(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
}

describe('MoodScreen: the list', () => {
  it('has the Mood heading and invites a first entry when there are none', async () => {
    renderWithProviders(<MoodScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'Mood' })).toBeInTheDocument()
    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument()
  })

  it('lists the stored entries under the heading', async () => {
    await addMoodEntry({ ...oneEmotion('hopeful', 6), note: 'good news today' })

    renderWithProviders(<MoodScreen />)

    expect(await screen.findByText('Hopeful')).toBeInTheDocument()
    expect(screen.getByText('good news today')).toBeInTheDocument()
    expect(screen.queryByText(/coming soon/i)).not.toBeInTheDocument()
  })
})

describe('MoodScreen: deleting an entry', () => {
  it('removes the entry after a confirmation, and Add entry stays available', async () => {
    await addMoodEntry({ ...oneEmotion('calm', 10), note: 'a quiet morning' })
    renderWithProviders(<MoodScreen />)
    await screen.findByText('Calm')

    fireEvent.click(screen.getByRole('button', { name: /^Delete the Calm entry/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument()
    expect(screen.queryByText('a quiet morning')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
    expect(await db.moodEntries.count()).toBe(0)
  })
})

describe('MoodScreen: adding an entry', () => {
  it('offers a prominent Add entry action, with or without entries', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
  })

  it('opens the form, and hides the Add entry button while it is open', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    openForm()

    expect(screen.getByRole('heading', { name: 'New entry' })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Add entry' })).not.toBeInTheDocument()
  })

  it('shows the new entry at the top, with its note, and closes the form', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000)
    await addMoodEntry(oneEmotion('calm', 10))
    vi.restoreAllMocks()

    renderWithProviders(<MoodScreen />)
    await screen.findByText('Calm')

    openForm()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Happy' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Happy intensity' }), {
      target: { value: '8' },
    })
    fireEvent.change(screen.getByRole('textbox', { name: /note/i }), {
      target: { value: 'a lovely walk' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    // Wait for the list to grow from one entry to two before reading the top one.
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(2)
    })

    const newest = screen.getAllByRole('listitem')[0] ?? document.body

    expect(within(newest).getByText('Happy')).toBeInTheDocument()
    expect(within(newest).getByText('8/10')).toBeInTheDocument()
    expect(within(newest).getByText('a lovely walk')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
  })

  it('shows an entry with three emotions at the top, each with its own rating', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    openForm()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Hopeful' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Anxious intensity' }), {
      target: { value: '7' },
    })
    fireEvent.change(screen.getByRole('slider', { name: 'Hopeful intensity' }), {
      target: { value: '4' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    const item = await screen.findByRole('listitem')
    const names = within(item)
      .getAllByText(/^(Anxious|Hopeful|Sad)$/)
      .map((node) => node.textContent)
    const ratings = within(item)
      .getAllByText(/^\d+\/10$/)
      .map((node) => node.textContent)

    expect(names).toEqual(['Anxious', 'Hopeful', 'Sad'])
    expect(ratings).toEqual(['Intensity 7/10', 'Intensity 4/10', 'Intensity 5/10'])
    expect(
      within(item).getByRole('button', { name: /^Delete the Anxious, Hopeful and Sad entry/ }),
    ).toBeInTheDocument()
  })

  it('does not let a fourth emotion be added from the screen either', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    openForm()
    for (const label of ['Calm', 'Happy', 'Sad', 'Tired']) {
      fireEvent.click(screen.getByRole('checkbox', { name: label }))
    }

    expect(screen.getByRole('checkbox', { name: 'Tired' })).toBeDisabled()
    expect(screen.getAllByRole('slider')).toHaveLength(3)
  })

  it('gives focus back to the Add entry button once the form closes', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    openForm()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByText('Calm', { selector: 'p' })

    expect(screen.getByRole('button', { name: 'Add entry' })).toHaveFocus()
  })

  it('replaces the empty state once the first entry is saved', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    openForm()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Grateful' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('Grateful', { selector: 'p' })).toBeInTheDocument()
    expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()
  })

  it('saves nothing on Cancel, and goes back to the Add entry button', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    openForm()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toHaveFocus()
    expect(await db.moodEntries.count()).toBe(0)
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument()
  })

  it('starts with a clean form each time it is opened', async () => {
    renderWithProviders(<MoodScreen />)
    await screen.findByText(/no entries yet/i)

    openForm()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    openForm()

    expect(screen.getByRole('checkbox', { name: 'Sad' })).not.toBeChecked()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()
  })
})
