import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { formatEntryTime, toDateTimeFieldValue } from '@/mood/format'
import { addThoughtRecord, deleteThoughtRecord } from '@/thoughts/repository'
import type { NewThoughtRecord } from '@/thoughts/types'
import { openRecordScreen } from '@tests/helpers/recordScreen'
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

beforeEach(async () => {
  await db.thoughtRecords.clear()
  olderId = (await addThoughtRecord({ ...full, createdAt: OLDER })).id
  await addThoughtRecord({ ...newThought({ thought: 'newer thought' }), createdAt: NEWER })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function thoughtPart(): HTMLElement {
  return screen.getByRole('region', { name: 'The thought' })
}

function flowRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Edit thought record' })
}

function flowHeading(): HTMLElement {
  return within(flowRegion()).getByRole('heading', { level: 2 })
}

async function openEdit(): Promise<void> {
  await openRecordScreen(olderId)
  fireEvent.click(within(thoughtPart()).getByRole('button', { name: 'Edit' }))
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
  it('opens the steps in place of the thought, starting at the first step', async () => {
    await openEdit()

    expect(flowRegion()).toBeInTheDocument()
    expect(within(flowRegion()).getByText('Edit record · Step 1 of 6')).toBeInTheDocument()
    expect(flowHeading()).toHaveTextContent('The situation')
    expect(flowHeading()).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'The thought' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Challenge' })).toBeInTheDocument()
  })

  it('fills every step with the record', async () => {
    await openEdit()

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
  it('shows the updated record, announces it, and returns focus to Edit', async () => {
    await openEdit()

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

    expect(await within(thoughtPart()).findByText('I might cope')).toBeInTheDocument()
    expect(within(thoughtPart()).getByText('Quarterly review')).toBeInTheDocument()
    expect(within(thoughtPart()).getByText('Calm')).toBeInTheDocument()
    expect(within(thoughtPart()).queryByText('Sad')).not.toBeInTheDocument()
    expect(within(thoughtPart()).queryByText('I will fail')).not.toBeInTheDocument()
    expect(screen.getByText('Record updated.')).toBeInTheDocument()

    expect(await db.thoughtRecords.get(olderId)).toMatchObject({
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
      expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toHaveFocus()
    })
  })

  it('keeps the exact time when the time field is not touched', async () => {
    await openEdit()
    toTime()
    save()
    await closed()

    expect((await db.thoughtRecords.get(olderId))?.createdAt).toBe(OLDER)
  })

  it('shows the new time, and the list puts the record in its new place', async () => {
    await openEdit()
    toTime()
    fireEvent.change(timeField(), { target: { value: '2020-01-05T10:00' } })
    save()
    await closed()

    const changed = new Date(2020, 0, 5, 10, 0).getTime()

    expect(await within(thoughtPart()).findByText(formatEntryTime(changed))).toBeInTheDocument()
    expect((await db.thoughtRecords.get(olderId))?.createdAt).toBe(changed)

    fireEvent.click(screen.getByRole('link', { name: 'Back to thoughts' }))

    await screen.findAllByRole('listitem')
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('I will fail')
    })
    expect(screen.getAllByRole('listitem')[1]).toHaveTextContent('newer thought')
  })

  it('removes an optional answer that was cleared, from the screen and from storage', async () => {
    await openEdit()
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
    const before = await db.thoughtRecords.get(olderId)

    await openEdit()
    toTime()
    fireEvent.change(timeField(), { target: { value: '2999-01-01T09:00' } })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/future/i)
    expect(flowHeading()).toHaveTextContent('When it happened')
    expect(await db.thoughtRecords.get(olderId)).toEqual(before)
  })

  it('cannot be saved with no feelings or no thought', async () => {
    await openEdit()
    advance()
    fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })
})

describe('editing a thought record: closing', () => {
  it('closes at once with nothing to discard when nothing was changed, and returns focus', async () => {
    await openEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    expect(screen.queryByText('Discard this record?')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toHaveFocus()
    })
  })

  it('asks before discarding changes, and the record stays unchanged when discarded', async () => {
    const before = await db.thoughtRecords.get(olderId)

    await openEdit()
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
    await openEdit()
    toTime()
    save()
    await closed()
    expect(await screen.findByText('Record updated.')).toBeInTheDocument()

    fireEvent.click(within(thoughtPart()).getByRole('button', { name: 'Edit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    expect(screen.queryByText('Record updated.')).not.toBeInTheDocument()
  })
})

describe('editing a thought record: a record that is gone', () => {
  it('tells the user, recreates nothing, and closes the flow when the record is deleted meanwhile', async () => {
    await openEdit()
    await deleteThoughtRecord(olderId)

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Edit thought record' })).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(1)
  })
})
