import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtChallenge, saveThoughtTest } from '@/thoughts/repository'
import type { ThoughtTest } from '@/thoughts/types'
import { openRecordScreen } from '@tests/helpers/recordScreen'
import { newThought } from '@tests/helpers/thoughts'

const HAPPENED = new Date(2020, 0, 1, 9, 0).getTime()

const RESULT_LABEL = 'What happened when you tested it?'
const BELIEF_LABEL = 'How strongly do you believe the original thought now?'
const PLAN_LABEL = 'How and when could you test this thought?'

const planned: ThoughtTest = {
  status: 'planned',
  plan: 'Say hello to two people on Monday',
  prediction: 'Nobody will answer',
}

const done: ThoughtTest = { ...planned, status: 'done', result: 'Both of them answered', belief: 3 }

let id = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (
    await addThoughtRecord({
      ...newThought({ thought: 'Nobody will talk to me', belief: 9 }),
      createdAt: HAPPENED,
    })
  ).id
  await saveThoughtTest(id, planned)
})

afterEach(() => {
  vi.restoreAllMocks()
})

function testPart(): HTMLElement {
  return screen.getByRole('region', { name: 'Test' })
}

function challengePart(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge' })
}

function resultRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Log the result' })
}

function heading(): HTMLElement {
  return within(resultRegion()).getByRole('heading', { level: 2 })
}

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function type(label: string, text: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } })
}

function slider(label: string, value: number): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
}

function step(number: number): void {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) }))
}

async function openLog(): Promise<void> {
  await openRecordScreen(id)
  fireEvent.click(within(testPart()).getByRole('button', { name: 'Log the result' }))
}

async function resultClosed(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Log the result' })).not.toBeInTheDocument()
  })
}

async function saveResult(): Promise<void> {
  type(RESULT_LABEL, 'Both of them answered')
  advance()
  slider(BELIEF_LABEL, 3)
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await resultClosed()
}

describe('the Test part with a planned test', () => {
  it('offers Log the result, with Revise the plan beside it', async () => {
    await openRecordScreen(id)

    const part = within(testPart())

    expect(part.getByText('Test planned')).toBeInTheDocument()
    expect(part.getByRole('button', { name: 'Log the result' })).toBeEnabled()
    expect(part.getByRole('button', { name: 'Revise the plan' })).toBeEnabled()
    expect(part.queryByRole('button', { name: 'Revise the result' })).not.toBeInTheDocument()
  })
})

describe('the result flow', () => {
  it('opens in place of the Test part, on its first step, with two step markers', async () => {
    await openLog()

    expect(within(resultRegion()).getByText('Test result · Step 1 of 2')).toBeInTheDocument()
    expect(heading()).toHaveTextContent('What happened')
    expect(heading()).toHaveFocus()
    expect(within(resultRegion()).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('region', { name: 'Test' })).not.toBeInTheDocument()
    expect(within(resultRegion()).getByText('Nobody will talk to me')).toBeInTheDocument()
  })

  it('needs what happened before going on, and says why', async () => {
    await openLog()

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAccessibleDescription(
      'Write what happened to continue.',
    )
    expect(screen.getByRole('button', { name: /^Step 2:/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    type(RESULT_LABEL, '   ')

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    type(RESULT_LABEL, 'They answered')

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('starts the belief at the original rating', async () => {
    await openLog()
    type(RESULT_LABEL, 'They answered')
    advance()

    expect(heading()).toHaveTextContent('How much you believe it now')
    expect(screen.getByLabelText(BELIEF_LABEL)).toHaveValue('9')
  })

  it('limits the answer to 500 characters', async () => {
    await openLog()

    expect(screen.getByLabelText(RESULT_LABEL)).toHaveAttribute('maxlength', '500')
  })
})

describe('saving a result', () => {
  it('shows the plan, the prediction, the result and the belief before and now', async () => {
    await openLog()
    await saveResult()

    const part = within(testPart())

    expect(part.getByText('Say hello to two people on Monday')).toBeInTheDocument()
    expect(part.getByText('Nobody will answer')).toBeInTheDocument()
    expect(part.getByText('Both of them answered')).toBeInTheDocument()
    expect(part.getByText('Before and now')).toBeInTheDocument()
    expect(part.getByText('From 9 to 3 out of 10')).toBeInTheDocument()
    expect(part.queryByText('Test planned')).not.toBeInTheDocument()
    expect(part.getByRole('button', { name: 'Revise the result' })).toBeEnabled()
    expect(part.getByRole('button', { name: 'Revise the plan' })).toBeEnabled()
    expect(part.queryByRole('button', { name: 'Log the result' })).not.toBeInTheDocument()
  })

  it('stores the result with the plan and prediction, and changes nothing else in the record', async () => {
    const before = await db.thoughtRecords.get(id)

    await openLog()
    await saveResult()

    expect(await db.thoughtRecords.get(id)).toEqual({
      ...before,
      test: { ...done },
    })
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('announces it, and keeps focus on the Revise the result button, where it stays', async () => {
    await openLog()
    await saveResult()

    expect(await screen.findByText('Test result saved.')).toBeInTheDocument()
    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Revise the result' })).toHaveFocus()
    })
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(within(testPart()).getByRole('button', { name: 'Revise the result' })).toHaveFocus()
  })

  it('saves once when Save is tapped twice', async () => {
    const put = vi.spyOn(db.thoughtRecords, 'put')

    await openLog()
    type(RESULT_LABEL, 'They answered')
    advance()

    const button = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(button)
    fireEvent.click(button)
    await resultClosed()

    expect(put).toHaveBeenCalledTimes(1)
  })

  it('shows a calm message and keeps everything typed when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const before = await db.thoughtRecords.get(id)

    await openLog()
    type(RESULT_LABEL, 'kept result')
    advance()
    slider(BELIEF_LABEL, 2)
    vi.spyOn(db.thoughtRecords, 'put').mockRejectedValue(new Error('storage unavailable'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(heading()).toHaveTextContent('How much you believe it now')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()
    expect(screen.getByLabelText(BELIEF_LABEL)).toHaveValue('2')

    step(1)

    expect(screen.getByLabelText(RESULT_LABEL)).toHaveValue('kept result')

    vi.restoreAllMocks()
    expect(await db.thoughtRecords.get(id)).toEqual(before)
  })
})

describe('closing the result flow', () => {
  it('closes at once when nothing was entered, and returns focus to Log the result', async () => {
    const before = await db.thoughtRecords.get(id)

    await openLog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await resultClosed()

    expect(screen.queryByText('Discard this result?')).not.toBeInTheDocument()
    expect(await db.thoughtRecords.get(id)).toEqual(before)
    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Log the result' })).toHaveFocus()
    })
  })

  it('asks before discarding what was typed, and leaves the record unchanged when discarded', async () => {
    const before = await db.thoughtRecords.get(id)

    await openLog()
    type(RESULT_LABEL, 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard this result?')
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await resultClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    expect(screen.queryByText('Test result saved.')).not.toBeInTheDocument()
  })

  it('does not ask when what was typed has been cleared again', async () => {
    await openLog()
    type(RESULT_LABEL, 'typed')
    type(RESULT_LABEL, '')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await resultClosed()

    expect(screen.queryByText('Discard this result?')).not.toBeInTheDocument()
  })
})

describe('revising a logged test', () => {
  beforeEach(async () => {
    await saveThoughtTest(id, done)
  })

  it('shows Revise the result and Revise the plan, and no Test planned label', async () => {
    await openRecordScreen(id)

    expect(within(testPart()).queryByText('Test planned')).not.toBeInTheDocument()
    expect(within(testPart()).getByRole('button', { name: 'Revise the result' })).toBeEnabled()
    expect(within(testPart()).getByRole('button', { name: 'Revise the plan' })).toBeEnabled()
  })

  it('opens the result flow filled, with both steps reachable', async () => {
    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the result' }))

    expect(screen.getByLabelText(RESULT_LABEL)).toHaveValue('Both of them answered')
    expect(screen.getByRole('button', { name: /^Step 2:/ })).not.toHaveAttribute('aria-disabled')

    step(2)

    expect(screen.getByLabelText(BELIEF_LABEL)).toHaveValue('3')
  })

  it('saves a revised result over the old one, and announces it', async () => {
    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the result' }))
    type(RESULT_LABEL, 'Only one of them answered')
    step(2)
    slider(BELIEF_LABEL, 6)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await resultClosed()

    const part = within(testPart())

    expect(part.getByText('Only one of them answered')).toBeInTheDocument()
    expect(part.queryByText('Both of them answered')).not.toBeInTheDocument()
    expect(part.getByText('From 9 to 6 out of 10')).toBeInTheDocument()
    expect(await screen.findByText('Result updated.')).toBeInTheDocument()
    expect((await db.thoughtRecords.get(id))?.test).toEqual({
      ...done,
      result: 'Only one of them answered',
      belief: 6,
    })
  })

  it('keeps the result and the belief when only the plan is revised', async () => {
    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the plan' }))
    type(PLAN_LABEL, 'Say hello to three people')
    step(2)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Plan a test' })).not.toBeInTheDocument()
    })

    expect((await db.thoughtRecords.get(id))?.test).toEqual({
      ...done,
      plan: 'Say hello to three people',
    })
    expect(within(testPart()).getByText('Say hello to three people')).toBeInTheDocument()
    expect(within(testPart()).getByText('Both of them answered')).toBeInTheDocument()
  })

  it('asks before discarding when only the belief was moved', async () => {
    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the result' }))
    step(2)
    slider(BELIEF_LABEL, 7)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard this result?')

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await resultClosed()

    expect((await db.thoughtRecords.get(id))?.test).toEqual(done)
  })

  it('keeps the old result when the revision is cancelled', async () => {
    const before = await db.thoughtRecords.get(id)

    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the result' }))
    type(RESULT_LABEL, 'never saved')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await resultClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Revise the result' })).toHaveFocus()
    })
  })
})

describe('a record with both a challenge and a test', () => {
  it('shows each part with its own belief before and now', async () => {
    await saveThoughtTest(id, done)
    await saveThoughtChallenge(id, {
      balanced: 'Some people will talk to me',
      belief: 5,
      emotions: [{ emotion: 'anxious', intensity: 4 }],
    })
    await openRecordScreen(id)

    expect(within(challengePart()).getByText('From 9 to 5 out of 10')).toBeInTheDocument()
    expect(within(testPart()).getByText('From 9 to 3 out of 10')).toBeInTheDocument()
  })

  it('lets a test be planned and logged with no challenge, and a challenge with no test', async () => {
    await openRecordScreen(id)

    expect(
      within(challengePart()).getByRole('button', { name: 'Challenge this thought' }),
    ).toBeEnabled()
    expect(within(testPart()).getByRole('button', { name: 'Log the result' })).toBeEnabled()
  })
})

describe('one flow at a time with the result', () => {
  it('switches Edit, Challenge, Delete and the plan off while the result is open', async () => {
    await openLog()

    expect(
      within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
        name: 'Edit',
      }),
    ).toBeDisabled()
    expect(
      within(challengePart()).getByRole('button', { name: 'Challenge this thought' }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete this record' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await resultClosed()

    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Revise the plan' })).toBeEnabled()
    })
  })

  it('switches Log the result off while the plan is open', async () => {
    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the plan' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Plan a test' })).not.toBeInTheDocument()
    })

    fireEvent.click(
      within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
        name: 'Edit',
      }),
    )

    expect(within(testPart()).getByRole('button', { name: 'Log the result' })).toBeDisabled()
    expect(within(testPart()).getByRole('button', { name: 'Revise the plan' })).toBeDisabled()
  })
})

describe('a record deleted', () => {
  it('while the result flow is open: says so calmly, closes the flow and recreates nothing', async () => {
    await openLog()
    type(RESULT_LABEL, 'typed')
    await db.thoughtRecords.delete(id)

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Log the result' })).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(0)
  })

  it('from its screen takes its test with it', async () => {
    await saveThoughtTest(id, done)
    await openRecordScreen(id)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this record' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('Record deleted. No records left.')).toBeInTheDocument()
    expect(await db.thoughtRecords.toArray()).toEqual([])
  })
})
