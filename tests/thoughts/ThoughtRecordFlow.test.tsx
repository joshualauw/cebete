import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { toDateTimeFieldValue } from '@/mood/format'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { renderWithProviders } from '@tests/helpers/render'

const OPENED_AT = new Date(2026, 5, 10, 14, 35, 42, 123).getTime()
const SAVED_AT = OPENED_AT + 5 * 60_000 + 456

beforeEach(async () => {
  await db.thoughtRecords.clear()
  vi.spyOn(Date, 'now').mockReturnValue(OPENED_AT)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function openFlow(): void {
  renderWithProviders(<ThoughtsScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'New thought record' }))
}

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function type(label: string, text: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } })
}

function choose(label: string): void {
  fireEvent.click(screen.getByRole('checkbox', { name: label }))
}

function heading(): HTMLElement {
  return within(screen.getByRole('region', { name: 'New thought record' })).getByRole('heading', {
    level: 2,
  })
}

function timeField(): HTMLInputElement {
  const field = screen.getByLabelText('Date and time')

  if (!(field instanceof HTMLInputElement)) {
    throw new Error('The date and time field is not an input')
  }

  return field
}

function goToTime(): void {
  type('What was happening?', 'Team meeting')
  advance()
  choose('Anxious')
  choose('Sad')
  fireEvent.change(screen.getByRole('slider', { name: 'Anxious intensity' }), {
    target: { value: '8' },
  })
  advance()
  type('What did you do?', 'stayed quiet')
  advance()
  type('What went through your mind?', 'I will fail')
  advance()
  fireEvent.change(screen.getByLabelText('How strongly do you believe this thought?'), {
    target: { value: '9' },
  })
  advance()
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

describe('ThoughtRecordFlow: the steps', () => {
  it('opens in place of the New button, on the first step, with focus on it', () => {
    openFlow()

    expect(screen.queryByRole('button', { name: 'New thought record' })).not.toBeInTheDocument()
    expect(heading()).toHaveTextContent('The situation')
    expect(screen.getByText('New record · Step 1 of 6')).toBeInTheDocument()
    expect(heading()).toHaveFocus()
  })

  it('asks one question per screen, in order, and moves focus to each step', () => {
    openFlow()

    const expected = [
      ['The situation', 'What was happening?'],
      ['Your feelings', 'How are you feeling?'],
      ['What you did', 'What did you do?'],
      ['Your thought', 'What went through your mind?'],
      ['How much you believe it', 'How strongly do you believe this thought?'],
      ['When it happened', 'Date and time'],
    ] as const

    expected.forEach(([title, question], index) => {
      expect(heading()).toHaveTextContent(title)
      expect(heading()).toHaveFocus()
      expect(screen.getByText(`New record · Step ${String(index + 1)} of 6`)).toBeInTheDocument()
      expect(screen.getAllByText(question).length).toBeGreaterThan(0)

      if (index === 1) {
        choose('Calm')
      }
      if (index === 3) {
        type('What went through your mind?', 'x')
      }
      if (index < expected.length - 1) {
        advance()
      }
    })
  })

  it('offers Skip on the optional steps while they are empty, and Next once they have text', () => {
    openFlow()

    expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()

    type('What was happening?', 'something')

    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()

    type('What was happening?', '')
    advance()
    choose('Calm')
    advance()

    expect(heading()).toHaveTextContent('What you did')
    expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()
  })

  it('does not let the feelings step be skipped, and says why', () => {
    openFlow()
    advance()

    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAccessibleDescription(
      'Choose how you felt to continue.',
    )

    choose('Calm')

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('does not let the thought step be passed until a thought is written', () => {
    openFlow()
    advance()
    choose('Calm')
    advance()
    advance()

    expect(heading()).toHaveTextContent('Your thought')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    type('What went through your mind?', '   ')

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    type('What went through your mind?', 'a thought')

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('has no Back on the first step, and Back keeps what was typed and chosen', () => {
    openFlow()

    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()

    type('What was happening?', 'kept text')
    advance()
    choose('Sad')
    advance()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(heading()).toHaveTextContent('Your feelings')
    expect(screen.getByRole('checkbox', { name: 'Sad' })).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('What was happening?')).toHaveValue('kept text')
  })

  it('starts the belief at 5 and the date and time at the current moment', () => {
    openFlow()
    advance()
    choose('Calm')
    advance()
    advance()
    type('What went through your mind?', 'x')
    advance()

    expect(screen.getByLabelText('How strongly do you believe this thought?')).toHaveValue('5')

    advance()

    expect(timeField()).toHaveValue(toDateTimeFieldValue(OPENED_AT))
  })
})

describe('ThoughtRecordFlow: saving', () => {
  it('saves everything entered, closes, shows the record at the top, and returns focus to New', async () => {
    openFlow()
    goToTime()
    save()

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 2, name: 'When it happened' }),
      ).not.toBeInTheDocument()
    })

    const [stored] = await db.thoughtRecords.toArray()

    expect(stored).toMatchObject({
      situation: 'Team meeting',
      emotions: [
        { emotion: 'anxious', intensity: 8 },
        { emotion: 'sad', intensity: 5 },
      ],
      action: 'stayed quiet',
      thought: 'I will fail',
      belief: 9,
    })
    expect(await screen.findByText('I will fail')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Team meeting')
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New thought record' })).toHaveFocus()
    })
  })

  it('leaves out the optional answers that were skipped', async () => {
    openFlow()
    advance()
    choose('Calm')
    advance()
    advance()
    type('What went through your mind?', 'just this')
    advance()
    advance()
    save()

    await screen.findByText('just this')

    const [stored] = await db.thoughtRecords.toArray()

    expect(stored).toBeDefined()
    expect(stored && 'situation' in stored).toBe(false)
    expect(stored && 'action' in stored).toBe(false)
  })

  it('stamps the exact moment of saving when the time is left alone, even after a while', async () => {
    openFlow()
    goToTime()
    vi.spyOn(Date, 'now').mockReturnValue(SAVED_AT)
    save()

    await waitFor(async () => {
      expect(await db.thoughtRecords.count()).toBe(1)
    })
    expect((await db.thoughtRecords.toArray())[0]?.createdAt).toBe(SAVED_AT)
  })

  it('keeps a time the user chose', async () => {
    openFlow()
    goToTime()
    fireEvent.change(timeField(), { target: { value: '2026-06-09T08:15' } })
    save()

    await waitFor(async () => {
      expect(await db.thoughtRecords.count()).toBe(1)
    })
    expect((await db.thoughtRecords.toArray())[0]?.createdAt).toBe(
      new Date(2026, 5, 9, 8, 15).getTime(),
    )
  })

  it.each([
    ['a time in the future', '2999-01-01T09:00', /future/i],
    ['an empty time', '', /valid date and time/i],
  ])(
    'refuses %s, stays open, keeps what was typed, and saves nothing',
    async (_name, value, message) => {
      openFlow()
      goToTime()
      fireEvent.change(timeField(), { target: { value } })
      save()

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(heading()).toHaveTextContent('When it happened')
      expect(await db.thoughtRecords.count()).toBe(0)

      fireEvent.click(screen.getByRole('button', { name: 'Back' }))
      fireEvent.click(screen.getByRole('button', { name: 'Back' }))

      expect(screen.getByLabelText('What went through your mind?')).toHaveValue('I will fail')
    },
  )

  it('shows a calm message and keeps everything when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    vi.spyOn(db.thoughtRecords, 'add').mockRejectedValue(new Error('storage unavailable'))
    openFlow()
    goToTime()
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(heading()).toHaveTextContent('When it happened')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('What went through your mind?')).toHaveValue('I will fail')
  })

  it('saves once when Save is tapped twice', async () => {
    const add = vi.spyOn(db.thoughtRecords, 'add')

    openFlow()
    goToTime()

    const button = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => {
      expect(
        screen.queryByRole('heading', { level: 2, name: 'When it happened' }),
      ).not.toBeInTheDocument()
    })
    expect(add).toHaveBeenCalledTimes(1)
  })
})

describe('ThoughtRecordFlow: closing', () => {
  it('closes at once when nothing was entered', () => {
    openFlow()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'New thought record' })).toBeInTheDocument()
    expect(screen.queryByText('Discard this record?')).not.toBeInTheDocument()
  })

  it('asks before discarding what was entered, with the safe choice focused', () => {
    openFlow()
    type('What was happening?', 'something')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard this record?')
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()
  })

  it('returns to the same step with everything kept when the user chooses Keep editing', () => {
    openFlow()
    type('What was happening?', 'still here')
    advance()
    choose('Calm')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(heading()).toHaveTextContent('Your feelings')
    expect(heading()).toHaveFocus()
    expect(screen.getByRole('checkbox', { name: 'Calm' })).toBeChecked()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('What was happening?')).toHaveValue('still here')
  })

  it('discards, saving nothing, and returns focus to the New button, when the user confirms', async () => {
    openFlow()
    goToTime()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))

    expect(await db.thoughtRecords.count()).toBe(0)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New thought record' })).toHaveFocus()
    })
  })

  it('asks before closing even when only a feeling was chosen', () => {
    openFlow()
    advance()
    choose('Calm')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard this record?')

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))

    expect(screen.getByRole('button', { name: 'New thought record' })).toBeInTheDocument()
  })
})
