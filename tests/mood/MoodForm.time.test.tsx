import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { toDateTimeFieldValue } from '@/mood/format'
import MoodForm from '@/mood/MoodForm'
import { addMoodEntry } from '@/mood/repository'
import MoodScreen from '@/screens/MoodScreen'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

// A moment well in the past, with seconds and milliseconds the date field cannot show.
const OPENED_AT = new Date(2026, 5, 10, 14, 35, 42, 123).getTime()
const SAVED_AT = OPENED_AT + 5 * 60_000 + 456

beforeEach(async () => {
  await db.moodEntries.clear()
  vi.spyOn(Date, 'now').mockReturnValue(OPENED_AT)
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

function choose(label: string): void {
  fireEvent.click(screen.getByRole('checkbox', { name: label }))
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

describe('MoodForm: the date and time picker when adding', () => {
  it('shows the picker filled with the current moment, under the New entry title', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'New entry' })).toBeInTheDocument()
    expect(timeField()).toHaveValue(toDateTimeFieldValue(OPENED_AT))
    expect(timeField()).toBeEnabled()
  })

  it('stamps the exact moment of saving when the picker is left alone, even if the form sat open', async () => {
    const onDone = vi.fn()

    renderWithProviders(<MoodForm onDone={onDone} />)
    choose('Calm')
    vi.spyOn(Date, 'now').mockReturnValue(SAVED_AT)
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })
    expect((await db.moodEntries.toArray()).map((entry) => entry.createdAt)).toEqual([SAVED_AT])
  })

  it('saves the time the user chose, exactly to the minute', async () => {
    const onDone = vi.fn()

    renderWithProviders(<MoodForm onDone={onDone} />)
    choose('Calm')
    fireEvent.change(timeField(), { target: { value: '2026-06-09T08:15' } })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })
    expect((await db.moodEntries.toArray()).map((entry) => entry.createdAt)).toEqual([
      new Date(2026, 5, 9, 8, 15).getTime(),
    ])
  })

  it.each([
    ['a time in the future', '2999-01-01T09:00', /future/i],
    ['an empty time', '', /valid date and time/i],
  ])('refuses %s, keeps what was typed, and saves nothing', async (_name, value, message) => {
    const onDone = vi.fn()

    renderWithProviders(<MoodForm onDone={onDone} />)
    choose('Calm')
    fireEvent.change(noteField(), { target: { value: 'kept in the form' } })
    fireEvent.change(timeField(), { target: { value } })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Calm' })).toBeChecked()
    expect(noteField()).toHaveValue('kept in the form')
    expect(await db.moodEntries.count()).toBe(0)
  })

  it('keeps what was typed and the chosen time when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    vi.spyOn(db.moodEntries, 'add').mockRejectedValue(new Error('storage unavailable'))
    renderWithProviders(<MoodForm onDone={() => undefined} />)
    choose('Calm')
    fireEvent.change(noteField(), { target: { value: 'try again' } })
    fireEvent.change(timeField(), { target: { value: '2026-06-09T08:15' } })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(noteField()).toHaveValue('try again')
    expect(timeField()).toHaveValue('2026-06-09T08:15')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()
  })

  it('still moves focus into the form when it opens', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'New entry' })).toHaveFocus()
  })
})

describe('MoodScreen: adding an entry with a chosen time', () => {
  it('places the new entry where its time puts it in the newest-first list', async () => {
    vi.restoreAllMocks()
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2020, 0, 1, 9, 0).getTime())
    await addMoodEntry(oneEmotion('calm', 3))
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2020, 0, 2, 9, 0).getTime())
    await addMoodEntry(oneEmotion('sad', 8))
    vi.restoreAllMocks()

    renderWithProviders(<MoodScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add entry' }))
    choose('Happy')
    fireEvent.change(timeField(), { target: { value: '2020-01-01T12:00' } })
    save()

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
    })

    const order = screen.getAllByRole('listitem').map((item) => item.textContent)

    expect(order).toHaveLength(3)
    expect(order[0]).toMatch(/Sad/)
    expect(order[1]).toMatch(/Happy/)
    expect(order[2]).toMatch(/Calm/)
  })

  it('returns focus to Add entry after saving', async () => {
    renderWithProviders(<MoodScreen />)
    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))
    choose('Calm')
    save()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add entry' })).toHaveFocus()
    })
  })
})
