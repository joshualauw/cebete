import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import MoodScreen from '@/screens/MoodScreen'
import { renderWithProviders } from '@tests/helpers/render'
import { oneEmotion } from '@tests/helpers/mood'

const OLDER = new Date(2020, 0, 1, 9, 0).getTime()
const NEWER = new Date(2020, 0, 2, 9, 0).getTime()

async function addAt(time: number, emotion: 'calm' | 'sad', intensity: number): Promise<void> {
  vi.spyOn(Date, 'now').mockReturnValue(time)
  await addMoodEntry(oneEmotion(emotion, intensity))
  vi.restoreAllMocks()
}

beforeEach(async () => {
  await db.moodEntries.clear()
  await addAt(OLDER, 'calm', 3)
  await addAt(NEWER, 'sad', 8)
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function editButtons(): Promise<HTMLElement[]> {
  return screen.findAllByRole('button', { name: /^Edit the / })
}

function itemTexts(): string[] {
  return screen.getAllByRole('listitem').map((item) => item.textContent)
}

describe('MoodList: editing from the list', () => {
  it('gives every entry an Edit action that names the entry', async () => {
    renderWithProviders(<MoodScreen />)

    const buttons = await editButtons()

    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveAccessibleName(/^Edit the Sad entry from /)
    expect(buttons[1]).toHaveAccessibleName(/^Edit the Calm entry from /)
  })

  it('opens the form in place of the entry, filled with its values', async () => {
    renderWithProviders(<MoodScreen />)
    const sadEdit = await screen.findByRole('button', { name: /^Edit the Sad/ })

    fireEvent.click(sadEdit)

    expect(screen.getByRole('heading', { name: 'Edit entry' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Sad' })).toBeChecked()
    expect(screen.getByRole('slider', { name: 'Sad intensity' })).toHaveValue('8')
    // The other entry is still shown, and the edited one is not shown twice.
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('button', { name: /^Edit the Sad/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Edit the Calm/ })).toBeInTheDocument()
  })

  it('shows the updated entry after saving, announces it, and returns focus to its Edit action', async () => {
    renderWithProviders(<MoodScreen />)
    const sadEdit = await screen.findByRole('button', { name: /^Edit the Sad/ })

    fireEvent.click(sadEdit)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    fireEvent.change(screen.getByRole('textbox', { name: /note/i }), {
      target: { value: 'much better' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Edit entry' })).not.toBeInTheDocument()
    })
    expect(await screen.findByText('much better')).toBeInTheDocument()
    expect(screen.getByText('Entry updated.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Edit the Sad and Calm entry/ })).toHaveFocus()
    })
  })

  it('moves an entry to its new place when its time changes, and keeps it after a reload', async () => {
    const view = renderWithProviders(<MoodScreen />)
    const sadEdit = await screen.findByRole('button', { name: /^Edit the Sad/ })

    expect(itemTexts()[0]).toMatch(/Sad/)

    fireEvent.click(sadEdit)
    fireEvent.change(screen.getByLabelText('Date and time'), {
      target: { value: '2019-12-31T08:00' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Edit entry' })).not.toBeInTheDocument()
    })
    expect(itemTexts()[0]).toMatch(/Calm/)
    expect(itemTexts()[1]).toMatch(/Sad/)

    view.unmount()
    renderWithProviders(<MoodScreen />)
    await editButtons()

    expect(itemTexts()[0]).toMatch(/Calm/)
    expect(itemTexts()[1]).toMatch(/Sad/)
  })

  it('does not leave an old "Entry updated." note behind when the next edit is cancelled', async () => {
    renderWithProviders(<MoodScreen />)

    fireEvent.click(await screen.findByRole('button', { name: /^Edit the Sad/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('Entry updated.')).toBeInTheDocument()

    fireEvent.click(await screen.findByRole('button', { name: /^Edit the Sad/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.queryByText('Entry updated.')).not.toBeInTheDocument()
    })
  })

  it('leaves the entry unchanged when the user cancels, and returns focus to its Edit action', async () => {
    renderWithProviders(<MoodScreen />)
    const sadEdit = await screen.findByRole('button', { name: /^Edit the Sad/ })
    const before = await db.moodEntries.toArray()

    fireEvent.click(sadEdit)
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await db.moodEntries.toArray()).toEqual(before)
    expect(screen.queryByRole('heading', { name: 'Edit entry' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Edit the Sad entry/ })).toHaveFocus()
    })
    expect(screen.queryByText('Entry updated.')).not.toBeInTheDocument()
  })

  it('switches the other Edit actions and Add entry off while an entry is being edited', async () => {
    renderWithProviders(<MoodScreen />)
    const sadEdit = await screen.findByRole('button', { name: /^Edit the Sad/ })

    fireEvent.click(sadEdit)

    expect(screen.getByRole('button', { name: /^Edit the Calm/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Edit the Calm/ })).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeEnabled()
  })

  it('switches every Edit action off while the add form is open', async () => {
    renderWithProviders(<MoodScreen />)
    await editButtons()

    fireEvent.click(screen.getByRole('button', { name: 'Add entry' }))

    for (const button of screen.getAllByRole('button', { name: /^Edit the / })) {
      expect(button).toBeDisabled()
    }

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      for (const button of screen.getAllByRole('button', { name: /^Edit the / })) {
        expect(button).toBeEnabled()
      }
    })
  })

  it('still lets an entry be deleted next to the Edit action', async () => {
    renderWithProviders(<MoodScreen />)
    await editButtons()

    for (const item of screen.getAllByRole('listitem')) {
      expect(within(item).getByRole('button', { name: /^Delete the / })).toBeEnabled()
    }
  })
})
