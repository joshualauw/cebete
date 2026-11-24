import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import MoodEntryItem from '@/mood/MoodEntryItem'
import { addMoodEntry } from '@/mood/repository'
import type { MoodEntry } from '@/mood/types'
import { renderWithProviders } from '@tests/helpers/render'

async function renderSavedEntry(onDeleted: () => void = () => undefined): Promise<MoodEntry> {
  const entry = await addMoodEntry({
    emotions: [{ emotion: 'anxious', intensity: 7 }],
    note: 'before the meeting',
  })
  renderWithProviders(<MoodEntryItem entry={entry} onDeleted={onDeleted} />)
  return entry
}

function openConfirmation(): void {
  fireEvent.click(screen.getByRole('button', { name: /^Delete the Anxious entry from/ }))
}

beforeEach(async () => {
  await db.moodEntries.clear()
})

describe('MoodEntryItem: what it shows', () => {
  it('shows a single emotion with its rating out of 10', async () => {
    await renderSavedEntry()

    expect(screen.getByText('Anxious')).toBeInTheDocument()
    expect(screen.getByText('7/10')).toBeInTheDocument()
  })

  it('says "Intensity" to screen readers, without repeating it on screen', async () => {
    await renderSavedEntry()

    const rating = screen.getByText('7/10')

    expect(rating).toHaveTextContent('Intensity 7/10')
  })

  it('shows every emotion of the entry, each with its own rating, in the order chosen', async () => {
    const entry = await addMoodEntry({
      emotions: [
        { emotion: 'sad', intensity: 2 },
        { emotion: 'anxious', intensity: 7 },
        { emotion: 'hopeful', intensity: 5 },
      ],
      note: 'mixed feelings',
    })
    renderWithProviders(<MoodEntryItem entry={entry} onDeleted={() => undefined} />)

    const names = screen.getAllByText(/^(Sad|Anxious|Hopeful)$/).map((node) => node.textContent)
    const ratings = screen.getAllByText(/^\d+\/10$/).map((node) => node.textContent)

    expect(names).toEqual(['Sad', 'Anxious', 'Hopeful'])
    // The word "Intensity" is there for screen readers, so the full text includes it.
    expect(ratings).toEqual(['Intensity 2/10', 'Intensity 7/10', 'Intensity 5/10'])
    expect(screen.getByText('mixed feelings')).toBeInTheDocument()
  })

  it('names every emotion on the Delete action, so it is clear which entry it belongs to', async () => {
    const entry = await addMoodEntry({
      emotions: [
        { emotion: 'sad', intensity: 2 },
        { emotion: 'anxious', intensity: 7 },
        { emotion: 'hopeful', intensity: 5 },
      ],
    })
    renderWithProviders(<MoodEntryItem entry={entry} onDeleted={() => undefined} />)

    expect(
      screen.getByRole('button', { name: /^Delete the Sad, Anxious and Hopeful entry from/ }),
    ).toBeInTheDocument()
  })

  it('names two emotions with "and"', async () => {
    const entry = await addMoodEntry({
      emotions: [
        { emotion: 'calm', intensity: 4 },
        { emotion: 'tired', intensity: 6 },
      ],
    })
    renderWithProviders(<MoodEntryItem entry={entry} onDeleted={() => undefined} />)

    expect(
      screen.getByRole('button', { name: /^Delete the Calm and Tired entry from/ }),
    ).toBeInTheDocument()
  })
})

describe('MoodEntryItem: delete', () => {
  it('offers a Delete action that says which entry it belongs to', async () => {
    await renderSavedEntry()

    const button = screen.getByRole('button', { name: /^Delete the Anxious entry from/ })

    expect(button).toHaveTextContent('Delete')
  })

  it('asks for confirmation first, and deletes nothing yet', async () => {
    const onDeleted = vi.fn()
    await renderSavedEntry(onDeleted)

    openConfirmation()

    expect(screen.getByText('Delete this entry? This cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: /Delete the Anxious entry from/ })).toBeInTheDocument()
    expect(await db.moodEntries.count()).toBe(1)
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('keeps showing the entry while it asks', async () => {
    await renderSavedEntry()

    openConfirmation()

    expect(screen.getByText('Anxious')).toBeInTheDocument()
    expect(screen.getByText('before the meeting')).toBeInTheDocument()
  })

  it('puts focus on the safe choice, Keep, when the question opens', async () => {
    await renderSavedEntry()

    openConfirmation()

    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus()
  })

  it('lets the user back out with Keep, leaving the entry untouched', async () => {
    const onDeleted = vi.fn()
    await renderSavedEntry(onDeleted)

    openConfirmation()
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument()
    expect(await db.moodEntries.count()).toBe(1)
    expect(onDeleted).not.toHaveBeenCalled()
  })

  it('gives focus back to the Delete action after backing out', async () => {
    await renderSavedEntry()

    openConfirmation()
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    expect(screen.getByRole('button', { name: /^Delete the Anxious entry from/ })).toHaveFocus()
  })

  it('deletes the entry once the user confirms, and says so', async () => {
    const onDeleted = vi.fn()
    await renderSavedEntry(onDeleted)

    openConfirmation()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalledOnce()
    })
    expect(await db.moodEntries.count()).toBe(0)
  })
})
