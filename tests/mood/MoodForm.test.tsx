import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { emotions } from '@/mood/emotions'
import MoodForm from '@/mood/MoodForm'
import { listMoodEntries } from '@/mood/repository'
import { INTENSITY_DEFAULT, MAX_EMOTIONS, NOTE_MAX_LENGTH } from '@/mood/types'
import { renderWithProviders } from '@tests/helpers/render'

function choose(label: string): void {
  fireEvent.click(screen.getByRole('checkbox', { name: label }))
}

function rate(label: string, value: number): void {
  fireEvent.change(screen.getByRole('slider', { name: `${label} intensity` }), {
    target: { value: String(value) },
  })
}

function typeNote(text: string): void {
  fireEvent.change(screen.getByRole('textbox', { name: /note/i }), { target: { value: text } })
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

function sliderNames(): (string | null)[] {
  return screen.queryAllByRole('slider').map((slider) => slider.getAttribute('id'))
}

beforeEach(async () => {
  await db.moodEntries.clear()
})

describe('MoodForm: choosing emotions', () => {
  it('offers every emotion, with none chosen to begin with', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    expect(screen.getAllByRole('checkbox')).toHaveLength(emotions.length)
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).not.toBeChecked()
    }
  })

  it('lets several emotions be chosen at once', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Anxious')
    choose('Hopeful')

    expect(screen.getByRole('checkbox', { name: 'Anxious' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Hopeful' })).toBeChecked()
  })

  it('removes an emotion when it is tapped again', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Anxious')
    choose('Anxious')

    expect(screen.getByRole('checkbox', { name: 'Anxious' })).not.toBeChecked()
  })

  it('does not let a fourth emotion be added, and says why', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Calm')
    choose('Happy')
    choose('Sad')
    choose('Tired')

    expect(screen.getByRole('checkbox', { name: 'Tired' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Tired' })).not.toBeChecked()
    expect(screen.getAllByRole('slider')).toHaveLength(MAX_EMOTIONS)
    expect(screen.getByText(/most you can choose/i)).toBeInTheDocument()
  })

  it('frees the others again once one is removed', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Calm')
    choose('Happy')
    choose('Sad')
    choose('Happy')

    expect(screen.getByRole('checkbox', { name: 'Tired' })).toBeEnabled()
    expect(screen.queryByText(/most you can choose/i)).not.toBeInTheDocument()

    choose('Tired')

    expect(screen.getByRole('checkbox', { name: 'Tired' })).toBeChecked()
  })
})

describe('MoodForm: a rating for each emotion', () => {
  it('shows no rating until an emotion is chosen', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    expect(screen.queryAllByRole('slider')).toHaveLength(0)
  })

  it('shows one rating per chosen emotion, in the order chosen, each starting in the middle', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Sad')
    choose('Anxious')

    const sliders = screen.getAllByRole('slider')

    expect(sliders.map((slider) => slider.getAttribute('aria-valuetext'))).toEqual([
      '5 out of 10',
      '5 out of 10',
    ])
    expect(sliderNames()).toHaveLength(2)
    expect(screen.getByRole('slider', { name: 'Sad intensity' })).toHaveValue(
      String(INTENSITY_DEFAULT),
    )
    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('5')
    expect(screen.getAllByText('5/10')).toHaveLength(2)
  })

  it('lets each rating change without touching the others', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Sad')
    choose('Anxious')
    choose('Hopeful')
    rate('Anxious', 8)

    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('8')
    expect(screen.getByRole('slider', { name: 'Sad intensity' })).toHaveValue('5')
    expect(screen.getByRole('slider', { name: 'Hopeful intensity' })).toHaveValue('5')
    expect(screen.getByText('8/10')).toBeInTheDocument()
  })

  it('drops the rating of a removed emotion, and starts fresh when it is chosen again', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Anxious')
    rate('Anxious', 9)
    choose('Anxious')

    expect(screen.queryByRole('slider', { name: 'Anxious intensity' })).not.toBeInTheDocument()

    choose('Anxious')

    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('5')
  })

  it('keeps the other ratings when one emotion is removed', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Sad')
    choose('Anxious')
    rate('Sad', 2)
    rate('Anxious', 7)
    choose('Sad')

    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('7')
    expect(screen.getAllByRole('slider')).toHaveLength(1)
  })

  it('says each rating in words as well as numbers', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Sad')
    rate('Sad', 3)

    expect(screen.getByRole('slider', { name: 'Sad intensity' })).toHaveAttribute(
      'aria-valuetext',
      '3 out of 10',
    )
  })
})

describe('MoodForm: the note and focus', () => {
  it('has an optional note with a visible length limit', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    const note = screen.getByRole('textbox', { name: 'Note (optional)' })

    expect(note).toHaveAttribute('maxlength', String(NOTE_MAX_LENGTH))
    expect(screen.getByText(`0/${String(NOTE_MAX_LENGTH)}`)).toBeInTheDocument()

    typeNote('rough day')

    expect(screen.getByText(`9/${String(NOTE_MAX_LENGTH)}`)).toBeInTheDocument()
  })

  it('moves focus into the form when it opens', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'New entry' })).toHaveFocus()
  })
})

describe('MoodForm: Save', () => {
  it('is unavailable until an emotion is chosen, and says why', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByText(/choose how you feel/i)).toBeInTheDocument()

    choose('Calm')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(screen.queryByText(/choose how you feel/i)).not.toBeInTheDocument()
  })

  it('is unavailable again if the only emotion is removed', () => {
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    choose('Calm')
    choose('Calm')

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })

  it('saves every chosen emotion with its own rating, in the order chosen, and the note', async () => {
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    choose('Anxious')
    choose('Hopeful')
    choose('Sad')
    rate('Anxious', 7)
    rate('Hopeful', 4)
    typeNote('before the meeting')
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })

    expect(await listMoodEntries()).toMatchObject([
      {
        emotions: [
          { emotion: 'anxious', intensity: 7 },
          { emotion: 'hopeful', intensity: 4 },
          { emotion: 'sad', intensity: 5 },
        ],
        note: 'before the meeting',
      },
    ])
  })

  it('does not save an emotion that was removed', async () => {
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    choose('Anxious')
    choose('Hopeful')
    rate('Anxious', 9)
    choose('Hopeful')
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })

    expect(await listMoodEntries()).toMatchObject([
      { emotions: [{ emotion: 'anxious', intensity: 9 }] },
    ])
  })

  it('saves the starting rating when the slider is left alone', async () => {
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    choose('Calm')
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })

    expect(await listMoodEntries()).toMatchObject([
      { emotions: [{ emotion: 'calm', intensity: INTENSITY_DEFAULT }] },
    ])
  })

  it.each([0, 10])('can save the boundary rating %i', async (intensity) => {
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    choose('Tired')
    rate('Tired', intensity)
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })

    expect(await listMoodEntries()).toMatchObject([{ emotions: [{ emotion: 'tired', intensity }] }])
  })

  it('leaves a blank note out instead of saving it', async () => {
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    choose('Calm')
    typeNote('   ')
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })

    const [saved] = await listMoodEntries()

    expect(Object.keys(saved ?? {})).not.toContain('note')
  })

  it('saves only once when Save is pressed twice in a row', async () => {
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    choose('Calm')
    // A double tap hits the same button twice. Once saving starts it is disabled.
    const saveButton = screen.getByRole('button', { name: 'Save' })
    fireEvent.click(saveButton)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled()
    })

    expect(await db.moodEntries.count()).toBe(1)
  })
})

describe('MoodForm: Cancel', () => {
  it('closes the form and saves nothing', async () => {
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    choose('Sad')
    choose('Calm')
    typeNote('never mind')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onDone).toHaveBeenCalledOnce()
    expect(await db.moodEntries.count()).toBe(0)
  })
})
