import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { toDateTimeFieldValue } from '@/mood/format'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { addThoughtRecord, deleteThoughtRecord } from '@/thoughts/repository'
import type { NewThoughtRecord } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const OLDER = new Date(2020, 0, 1, 9, 0, 30, 456).getTime()
const NEWER = new Date(2020, 0, 2, 9, 0).getTime()

const full: NewThoughtRecord = newThought({
  situation: 'Team meeting',
  action: 'stayed quiet',
  thought: 'I will fail',
  belief: 8,
  emotions: [
    { emotion: 'anxious', intensity: 7 },
    { emotion: 'sad', intensity: 3 },
  ],
})

let olderId = 0
let newerId = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  olderId = (await addThoughtRecord({ ...full, createdAt: OLDER })).id
  newerId = (
    await addThoughtRecord({ ...newThought({ thought: 'newer thought' }), createdAt: NEWER })
  ).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function flowRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Edit thought record' })
}

function flowHeading(): HTMLElement {
  return within(flowRegion()).getByRole('heading', { level: 2 })
}

async function openEdit(thought: RegExp | string): Promise<void> {
  const name =
    typeof thought === 'string' ? new RegExp(`^Edit the thought record “${thought}`) : thought

  fireEvent.click(await screen.findByRole('button', { name }))
}

function toTime(): void {
  for (let step = 0; step < 5; step += 1) {
    advance()
  }
}

function timeField(): HTMLInputElement {
  const field = screen.getByLabelText('Date and time')

  if (!(field instanceof HTMLInputElement)) {
    throw new Error('The date and time field is not an input')
  }

  return field
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

async function closed(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Edit thought record' })).not.toBeInTheDocument()
  })
}

describe('editing a thought record: opening', () => {
  it('gives every card an Edit action that names the record', async () => {
    renderWithProviders(<ThoughtsScreen />)

    const buttons = await screen.findAllByRole('button', { name: /^Edit the thought record/ })

    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveAccessibleName(/“newer thought”/)
    expect(buttons[1]).toHaveAccessibleName(/“I will fail”/)
  })

  it('opens the steps in place of the card, starting at the first step', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')

    expect(flowRegion()).toBeInTheDocument()
    expect(within(flowRegion()).getByText('Edit record · Step 1 of 6')).toBeInTheDocument()
    expect(flowHeading()).toHaveTextContent('The situation')
    expect(flowHeading()).toHaveFocus()
    const cardsOnly = screen
      .getAllByRole('listitem')
      .filter((item) => item.closest('ol[aria-label="Steps"]') === null)

    expect(cardsOnly).toHaveLength(2)
    expect(
      screen.queryByRole('button', { name: /^Edit the thought record “I will fail/ }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^Edit the thought record “newer thought/ }),
    ).toBeInTheDocument()
  })

  it('fills every step with the record', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')

    expect(screen.getByLabelText('What was happening?')).toHaveValue('Team meeting')
    advance()
    expect(screen.getByRole('checkbox', { name: 'Anxious' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Sad' })).toBeChecked()
    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('7')
    expect(screen.getByRole('slider', { name: 'Sad intensity' })).toHaveValue('3')
    advance()
    expect(screen.getByLabelText('What did you do?')).toHaveValue('stayed quiet')
    advance()
    expect(screen.getByLabelText('What went through your mind?')).toHaveValue('I will fail')
    advance()
    expect(screen.getByLabelText('How strongly do you believe this thought?')).toHaveValue('8')
    advance()
    expect(timeField()).toHaveValue(toDateTimeFieldValue(OLDER))
  })
})

describe('editing a thought record: saving', () => {
  it('shows the updated card, announces it, and returns focus to its Edit action', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')

    fireEvent.change(screen.getByLabelText('What was happening?'), {
      target: { value: 'Quarterly review' },
    })
    advance()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))
    advance()
    advance()
    fireEvent.change(screen.getByLabelText('What went through your mind?'), {
      target: { value: 'I might cope' },
    })
    advance()
    fireEvent.change(screen.getByLabelText('How strongly do you believe this thought?'), {
      target: { value: '3' },
    })
    advance()
    save()
    await closed()

    expect(await screen.findByText('I might cope')).toBeInTheDocument()
    expect(screen.getByText('Quarterly review')).toBeInTheDocument()
    expect(screen.queryByText('I will fail')).not.toBeInTheDocument()
    expect(screen.getByText('Record updated.')).toBeInTheDocument()

    const stored = await db.thoughtRecords.get(olderId)

    expect(stored).toMatchObject({
      id: olderId,
      situation: 'Quarterly review',
      emotions: [
        { emotion: 'anxious', intensity: 7 },
        { emotion: 'calm', intensity: 5 },
      ],
      action: 'stayed quiet',
      thought: 'I might cope',
      belief: 3,
    })
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^Edit the thought record “I might cope/ }),
      ).toHaveFocus()
    })
  })

  it('keeps the exact time when the time field is not touched', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    toTime()
    save()
    await closed()

    expect((await db.thoughtRecords.get(olderId))?.createdAt).toBe(OLDER)
  })

  it('moves the card to its new place when the time changes', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    toTime()
    fireEvent.change(timeField(), { target: { value: '2020-01-05T10:00' } })
    save()
    await closed()

    await waitFor(() => {
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('I will fail')
    })
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('newer thought')
    expect((await db.thoughtRecords.get(olderId))?.createdAt).toBe(
      new Date(2020, 0, 5, 10, 0).getTime(),
    )
  })

  it('removes an optional answer that was cleared, from the card and from storage', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    fireEvent.change(screen.getByLabelText('What was happening?'), { target: { value: '' } })
    toTime()
    save()
    await closed()

    await waitFor(() => {
      expect(screen.queryByText('Team meeting')).not.toBeInTheDocument()
    })
    expect(await db.thoughtRecords.get(olderId)).not.toHaveProperty('situation')
  })

  it('refuses a future time, stays open, and leaves the record as it was', async () => {
    renderWithProviders(<ThoughtsScreen />)
    const before = await db.thoughtRecords.get(olderId)

    await openEdit('I will fail')
    toTime()
    fireEvent.change(timeField(), { target: { value: '2999-01-01T09:00' } })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/future/i)
    expect(flowHeading()).toHaveTextContent('When it happened')
    expect(await db.thoughtRecords.get(olderId)).toEqual(before)
  })

  it('cannot be saved with no feelings or no thought', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    advance()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})

describe('editing a thought record: closing', () => {
  it('closes at once with nothing to discard when nothing was changed, and returns focus', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    expect(screen.queryByText('Discard this record?')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^Edit the thought record “I will fail/ }),
      ).toHaveFocus()
    })
  })

  it('asks before discarding changes, and the record stays unchanged when discarded', async () => {
    renderWithProviders(<ThoughtsScreen />)
    const before = await db.thoughtRecords.get(olderId)

    await openEdit('I will fail')
    fireEvent.change(screen.getByLabelText('What was happening?'), { target: { value: 'changed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(flowHeading()).toHaveTextContent('Discard this record?')
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await closed()

    expect(await db.thoughtRecords.get(olderId)).toEqual(before)
    expect(screen.queryByText('Record updated.')).not.toBeInTheDocument()
  })

  it('does not announce an update when the user cancels, even after an earlier update', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    toTime()
    save()
    await closed()
    expect(await screen.findByText('Record updated.')).toBeInTheDocument()

    await openEdit('I will fail')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    expect(screen.queryByText('Record updated.')).not.toBeInTheDocument()
  })
})

describe('editing a thought record: one flow at a time', () => {
  it('switches the other Edit actions and New thought record off while a record is edited', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')

    expect(
      screen.getByRole('button', { name: /^Edit the thought record “newer thought/ }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'New thought record' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /^Edit the thought record “newer thought/ }),
      ).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: 'New thought record' })).toBeEnabled()
  })

  it('switches every Edit action off while a new record is being captured', async () => {
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'New thought record' }))

    for (const button of screen.getAllByRole('button', { name: /^Edit the thought record/ })) {
      expect(button).toBeDisabled()
    }
  })
})

describe('editing a thought record: a record that is gone', () => {
  it('tells the user, recreates nothing, and closes the flow when the record is deleted meanwhile', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    await deleteThoughtRecord(olderId)

    expect(await screen.findByText(/was deleted, so nothing was saved/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Edit thought record' })).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(1)
    expect(screen.getByRole('button', { name: 'New thought record' })).toBeEnabled()
    expect(newerId).toBeGreaterThan(0)
  })

  it('clears that notice when the next edit starts', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await openEdit('I will fail')
    await deleteThoughtRecord(olderId)
    await screen.findByText(/was deleted, so nothing was saved/i)

    await openEdit('newer thought')

    expect(screen.queryByText(/was deleted, so nothing was saved/i)).not.toBeInTheDocument()
  })
})
