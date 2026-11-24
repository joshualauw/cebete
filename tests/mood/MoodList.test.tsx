import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import MoodList from '@/mood/MoodList'
import { addMoodEntry } from '@/mood/repository'
import type { NewMoodEntry } from '@/mood/types'
import { renderWithProviders } from '@tests/helpers/render'
import { oneEmotion } from '@tests/helpers/mood'

/** Saves an entry as if it had been recorded at the given time. */
async function saveAt(timestamp: number, entry: NewMoodEntry): Promise<void> {
  vi.spyOn(Date, 'now').mockReturnValue(timestamp)
  await addMoodEntry(entry)
}

beforeEach(async () => {
  await db.moodEntries.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('MoodList: entries', () => {
  it('shows the entries newest first', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    await saveAt(3_000, oneEmotion('sad', 2))
    await saveAt(2_000, oneEmotion('happy', 3))

    renderWithProviders(<MoodList />)

    const items = await screen.findAllByRole('listitem')

    expect(items.map((item) => within(item).getByText(/^(Calm|Sad|Happy)$/).textContent)).toEqual([
      'Sad',
      'Happy',
      'Calm',
    ])
  })

  it('shows the emotion, intensity out of 100, note and time of each entry', async () => {
    const recordedAt = new Date(2026, 10, 24, 15, 5).getTime()
    await saveAt(recordedAt, { ...oneEmotion('anxious', 7), note: 'before the meeting' })

    renderWithProviders(<MoodList />)

    const item = await screen.findByRole('listitem')

    expect(within(item).getByText('Anxious')).toBeInTheDocument()
    expect(within(item).getByText('7/10')).toBeInTheDocument()
    expect(within(item).getByText('before the meeting')).toBeInTheDocument()
    expect(item.querySelector('time')).toHaveAttribute(
      'datetime',
      new Date(recordedAt).toISOString(),
    )
    expect(item.querySelector('time')?.textContent).toMatch(/2026/)
  })

  it('shows a note only on the entry that has one', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    await saveAt(2_000, { ...oneEmotion('sad', 2), note: 'long day' })

    renderWithProviders(<MoodList />)

    const [sad, calm] = await screen.findAllByRole('listitem')

    expect(sad && within(sad).queryByText('long day')).toBeInTheDocument()
    expect(calm && within(calm).queryByText('long day')).not.toBeInTheDocument()
    expect(screen.getAllByText('long day')).toHaveLength(1)
  })

  it('keeps the line breaks of a note', async () => {
    await saveAt(1_000, { ...oneEmotion('calm', 10), note: 'first line\nsecond line' })

    renderWithProviders(<MoodList />)

    const note = await screen.findByText(/first line/)

    expect(note).toHaveStyle({ whiteSpace: 'pre-wrap' })
  })

  it('does not show the empty state when there are entries', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))

    renderWithProviders(<MoodList />)

    await screen.findByText('Calm')
    expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()
  })
})

describe('MoodList: empty state', () => {
  it('invites the user to add their first entry when there are none', async () => {
    renderWithProviders(<MoodList />)

    expect(await screen.findByRole('heading', { name: 'No entries yet' })).toBeInTheDocument()
    expect(screen.getByText(/add your first entry/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('never flashes while the entries are still loading', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))

    renderWithProviders(<MoodList />)

    // Straight after the first render nothing has been read yet. It must not claim "no entries".
    expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()

    expect(await screen.findByText('Calm')).toBeInTheDocument()
  })
})

/** Deletes the entry for an emotion by going through the real confirmation. */
function deleteEntryFor(label: string): void {
  const item = screen
    .getAllByRole('listitem')
    .find((candidate) => within(candidate).queryByText(label) !== null)

  if (!item) {
    throw new Error(`No entry found for ${label}`)
  }

  fireEvent.click(
    within(item).getByRole('button', { name: new RegExp(`^Delete the ${label} entry`) }),
  )
  fireEvent.click(within(item).getByRole('button', { name: 'Yes, delete' }))
}

describe('MoodList: deleting', () => {
  it('removes only the chosen entry, and the list updates', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    await saveAt(2_000, oneEmotion('sad', 2))
    await saveAt(3_000, oneEmotion('happy', 3))
    renderWithProviders(<MoodList />)
    await screen.findAllByRole('listitem')

    deleteEntryFor('Sad')

    await waitFor(() => {
      expect(screen.queryByText('Sad')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Calm')).toBeInTheDocument()
    expect(screen.getByText('Happy')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(await db.moodEntries.count()).toBe(2)
  })

  it('keeps the entry when the user backs out', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    renderWithProviders(<MoodList />)
    await screen.findByText('Calm')

    fireEvent.click(screen.getByRole('button', { name: /^Delete the Calm entry/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    expect(screen.getByText('Calm')).toBeInTheDocument()
    expect(await db.moodEntries.count()).toBe(1)
  })

  it('brings back the empty state when the last entry is deleted', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    renderWithProviders(<MoodList />)
    await screen.findByText('Calm')

    deleteEntryFor('Calm')

    expect(await screen.findByText(/no entries yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('says out loud that an entry was deleted, and how many are left', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    await saveAt(2_000, oneEmotion('sad', 2))
    await saveAt(3_000, oneEmotion('happy', 3))
    renderWithProviders(<MoodList />)
    await screen.findAllByRole('listitem')

    deleteEntryFor('Sad')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('Entry deleted. 2 entries left.')
    })
  })

  it.each([
    [1, 'Entry deleted. No entries left.'],
    [2, 'Entry deleted. 1 entry left.'],
  ])('words the announcement correctly when %i entries were there', async (count, expected) => {
    for (let index = 0; index < count; index += 1) {
      await saveAt(1_000 + index, oneEmotion('calm', 10))
    }
    renderWithProviders(<MoodList />)
    await screen.findAllByRole('listitem')

    deleteEntryFor('Calm')

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(expected)
    })
  })

  it('keeps the user in the list after a delete, so focus is not lost', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    await saveAt(2_000, oneEmotion('sad', 2))
    renderWithProviders(<MoodList />)
    await screen.findAllByRole('listitem')

    deleteEntryFor('Sad')

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Mood entries' })).toHaveFocus()
    })
  })
})

describe('MoodList: live updates', () => {
  it('shows a new entry as soon as it is stored, replacing the empty state', async () => {
    renderWithProviders(<MoodList />)
    await screen.findByText(/no entries yet/i)

    await act(async () => {
      await saveAt(1_000, oneEmotion('grateful', 9))
    })

    expect(await screen.findByText('Grateful')).toBeInTheDocument()
    expect(screen.queryByText(/no entries yet/i)).not.toBeInTheDocument()
  })

  it('puts a newly stored entry at the top of the list', async () => {
    await saveAt(1_000, oneEmotion('calm', 10))
    renderWithProviders(<MoodList />)
    await screen.findByText('Calm')

    await act(async () => {
      await saveAt(2_000, oneEmotion('happy', 8))
    })

    await screen.findByText('Happy')
    const items = screen.getAllByRole('listitem')

    expect(within(items[0] ?? document.body).getByText('Happy')).toBeInTheDocument()
    expect(within(items[1] ?? document.body).getByText('Calm')).toBeInTheDocument()
  })
})
