import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { toDateTimeFieldValue } from '@/mood/format'
import MoodForm from '@/mood/MoodForm'
import { addMoodEntry, deleteMoodEntry } from '@/mood/repository'
import type { MoodEntry } from '@/mood/types'
import { renderWithProviders } from '@tests/helpers/render'

// A moment well in the past, with seconds and milliseconds the date field cannot show.
const SAVED_AT = new Date(2026, 5, 10, 14, 35, 42, 123).getTime()

let entry: MoodEntry

beforeEach(async () => {
  await db.moodEntries.clear()
  vi.spyOn(Date, 'now').mockReturnValue(SAVED_AT)
  entry = await addMoodEntry({
    emotions: [
      { emotion: 'anxious', intensity: 7 },
      { emotion: 'hopeful', intensity: 4 },
    ],
    note: 'before the meeting',
  })
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function timeField(): HTMLInputElement {
  const field = screen.getByLabelText('Date and time')

  if (!(field instanceof HTMLInputElement)) {
    throw new Error('The date and time field is not an input')
  }

  return field
}

function noteField(): HTMLTextAreaElement {
  const field = screen.getByRole('textbox', { name: /note/i })

  if (!(field instanceof HTMLTextAreaElement)) {
    throw new Error('The note is not a text area')
  }

  return field
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

async function stored(): Promise<MoodEntry | undefined> {
  return db.moodEntries.get(entry.id)
}

describe('MoodForm: editing an entry', () => {
  it('opens filled with the entry, under its own title', () => {
    renderWithProviders(<MoodForm entry={entry} onDone={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'Edit entry' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Anxious' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Hopeful' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Calm' })).not.toBeChecked()
    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('7')
    expect(screen.getByRole('slider', { name: 'Hopeful intensity' })).toHaveValue('4')
    expect(noteField()).toHaveValue('before the meeting')
    expect(timeField()).toHaveValue(toDateTimeFieldValue(SAVED_AT))
  })

  it('moves focus into the form when it opens', () => {
    renderWithProviders(<MoodForm entry={entry} onDone={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'Edit entry' })).toHaveFocus()
  })

  it('saves a change to the emotions, a rating and the note, and closes', async () => {
    const onDone = vi.fn()
    const onSaved = vi.fn()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} onSaved={onSaved} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hopeful' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    fireEvent.change(screen.getByRole('slider', { name: 'Anxious intensity' }), {
      target: { value: '2' },
    })
    fireEvent.change(noteField(), { target: { value: 'afterwards' } })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })
    expect(onSaved).toHaveBeenCalledOnce()
    expect(await stored()).toEqual({
      id: entry.id,
      emotions: [
        { emotion: 'anxious', intensity: 2 },
        { emotion: 'calm', intensity: 5 },
      ],
      note: 'afterwards',
      createdAt: entry.createdAt,
    })
  })

  it('keeps the exact time when the date and time field is not touched', async () => {
    const onDone = vi.fn()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)
    fireEvent.change(noteField(), { target: { value: 'changed' } })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })
    expect((await stored())?.createdAt).toBe(SAVED_AT)
  })

  it('saves a new time chosen in the field', async () => {
    const onDone = vi.fn()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)
    fireEvent.change(timeField(), { target: { value: '2026-06-09T08:15' } })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })
    expect((await stored())?.createdAt).toBe(new Date(2026, 5, 9, 8, 15).getTime())
  })

  it('removes the note when it is cleared', async () => {
    const onDone = vi.fn()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)
    fireEvent.change(noteField(), { target: { value: '' } })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })
    expect(await stored()).not.toHaveProperty('note')
  })

  it('changes nothing when the user cancels', async () => {
    const onDone = vi.fn()
    const before = await stored()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    fireEvent.change(noteField(), { target: { value: 'never saved' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onDone).toHaveBeenCalledOnce()
    expect(await stored()).toEqual(before)
  })

  it('cannot be saved with no emotion chosen', () => {
    renderWithProviders(<MoodForm entry={entry} onDone={() => undefined} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Hopeful' }))

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('refuses a time in the future with a clear message, and the entry stays as it was', async () => {
    const onDone = vi.fn()
    const before = await stored()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)
    fireEvent.change(timeField(), { target: { value: '2999-01-01T09:00' } })
    fireEvent.change(noteField(), { target: { value: 'kept in the form' } })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/future/i)
    expect(onDone).not.toHaveBeenCalled()
    expect(noteField()).toHaveValue('kept in the form')
    expect(await stored()).toEqual(before)
  })

  it('refuses an empty date and time with a clear message', async () => {
    renderWithProviders(<MoodForm entry={entry} onDone={() => undefined} />)
    fireEvent.change(timeField(), { target: { value: '' } })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/valid date and time/i)
    expect((await stored())?.createdAt).toBe(SAVED_AT)
  })

  it('shows a calm message and keeps what was typed when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const onDone = vi.fn()
    const before = await stored()

    vi.spyOn(db.moodEntries, 'put').mockRejectedValue(new Error('storage unavailable'))
    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)
    fireEvent.change(noteField(), { target: { value: 'try again' } })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(onDone).not.toHaveBeenCalled()
    expect(noteField()).toHaveValue('try again')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    vi.restoreAllMocks()
    expect(await stored()).toEqual(before)
  })

  it('says so when the entry was deleted meanwhile, recreates nothing, and offers only Cancel', async () => {
    const onDone = vi.fn()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)
    await deleteMoodEntry(entry.id)
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer exists/i)
    expect(await db.moodEntries.count()).toBe(0)
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled()
    expect(onDone).not.toHaveBeenCalled()
  })

  it('saves once when Save is tapped twice', async () => {
    const put = vi.spyOn(db.moodEntries, 'put')
    const onDone = vi.fn()

    renderWithProviders(<MoodForm entry={entry} onDone={onDone} />)

    const button = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled()
    })
    expect(put).toHaveBeenCalledTimes(1)
  })
})
