import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtTest } from '@/thoughts/repository'
import { openRecordScreen } from '@tests/helpers/recordScreen'
import { newThought } from '@tests/helpers/thoughts'

const HAPPENED = new Date(2020, 0, 1, 9, 0).getTime()

const PLAN_LABEL = 'How and when could you test this thought?'
const PREDICTION_LABEL = 'If the thought were true, what do you predict would happen?'

let id = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (
    await addThoughtRecord({
      ...newThought({ situation: 'Team meeting', thought: 'Nobody will talk to me', belief: 9 }),
      createdAt: HAPPENED,
    })
  ).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

function testPart(): HTMLElement {
  return screen.getByRole('region', { name: 'Test' })
}

function planRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Plan a test' })
}

function heading(): HTMLElement {
  return within(planRegion()).getByRole('heading', { level: 2 })
}

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function type(label: string, text: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } })
}

function step(number: number): void {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) }))
}

async function openPlan(): Promise<void> {
  await openRecordScreen(id)
  fireEvent.click(within(testPart()).getByRole('button', { name: 'Plan a test' }))
}

async function planClosed(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Plan a test' })).not.toBeInTheDocument()
  })
}

async function savePlan(): Promise<void> {
  type(PLAN_LABEL, 'Say hello to two people on Monday')
  advance()
  type(PREDICTION_LABEL, 'Nobody will answer')
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  await planClosed()
}

describe('the Test part: before any plan', () => {
  it('invites the user to plan a test, and offers nothing else', async () => {
    await openRecordScreen(id)

    const part = within(testPart())

    expect(part.getByText(/has not been tested yet/i)).toBeInTheDocument()
    expect(part.getByRole('button', { name: 'Plan a test' })).toBeEnabled()
    expect(part.queryByRole('button', { name: 'Revise the plan' })).not.toBeInTheDocument()
    expect(part.queryByText('Test planned')).not.toBeInTheDocument()
  })

  it('sits below the Challenge part and above Delete', async () => {
    await openRecordScreen(id)

    const challenge = screen.getByRole('region', { name: 'Challenge' })
    const remove = screen.getByRole('button', { name: 'Delete this record' })

    expect(
      testPart().compareDocumentPosition(challenge) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy()
    expect(
      testPart().compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})

describe('the plan flow', () => {
  it('opens in place of the Test part, on its first step, with two step markers', async () => {
    await openPlan()

    expect(within(planRegion()).getByText('Plan a test · Step 1 of 2')).toBeInTheDocument()
    expect(heading()).toHaveTextContent('How and when')
    expect(heading()).toHaveFocus()
    expect(within(planRegion()).getAllByRole('listitem')).toHaveLength(2)
    expect(screen.queryByRole('region', { name: 'Test' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'The thought' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Challenge' })).toBeInTheDocument()
  })

  it('keeps the thought visible as one line on both steps', async () => {
    await openPlan()

    expect(within(planRegion()).getByText('Nobody will talk to me')).toBeInTheDocument()

    type(PLAN_LABEL, 'Say hello')
    advance()

    expect(within(planRegion()).getByText('Nobody will talk to me')).toBeInTheDocument()
  })

  it('asks the two questions in order', async () => {
    await openPlan()

    expect(heading()).toHaveTextContent('How and when')
    expect(screen.getByLabelText(PLAN_LABEL)).toBeInTheDocument()

    type(PLAN_LABEL, 'Say hello')
    advance()

    expect(heading()).toHaveTextContent('Your prediction')
    expect(screen.getByLabelText(PREDICTION_LABEL)).toBeInTheDocument()
  })

  it('needs how and when before going on, and says why', async () => {
    await openPlan()

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAccessibleDescription(
      'Write how and when you could test it to continue.',
    )
    expect(screen.getByRole('button', { name: /^Step 2:/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    type(PLAN_LABEL, '   ')

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    type(PLAN_LABEL, 'Say hello')

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^Step 2:/ })).not.toHaveAttribute('aria-disabled')
  })

  it('needs the prediction before it can be saved, and says why', async () => {
    await openPlan()
    type(PLAN_LABEL, 'Say hello')
    advance()

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription(
      'Write your prediction to continue.',
    )

    type(PREDICTION_LABEL, '  ')

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    type(PREDICTION_LABEL, 'Nobody will answer')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('limits each answer to 500 characters and shows how many are used', async () => {
    await openPlan()

    expect(screen.getByLabelText(PLAN_LABEL)).toHaveAttribute('maxlength', '500')

    type(PLAN_LABEL, 'twelve chars')

    expect(screen.getByText('12/500')).toBeInTheDocument()

    advance()

    expect(screen.getByLabelText(PREDICTION_LABEL)).toHaveAttribute('maxlength', '500')
  })
})

describe('saving a plan', () => {
  it('shows the plan and the prediction with a calm Test planned label', async () => {
    await openPlan()
    await savePlan()

    const part = within(testPart())

    expect(part.getByText('Test planned')).toBeInTheDocument()
    expect(part.getByText('Say hello to two people on Monday')).toBeInTheDocument()
    expect(part.getByText('Nobody will answer')).toBeInTheDocument()
    expect(part.queryByText(/has not been tested yet/i)).not.toBeInTheDocument()
    expect(part.queryByRole('button', { name: 'Plan a test' })).not.toBeInTheDocument()
    expect(part.getByRole('button', { name: 'Revise the plan' })).toBeEnabled()
  })

  it('stores the plan on the same record and changes nothing else in it', async () => {
    const before = await db.thoughtRecords.get(id)

    await openPlan()
    await savePlan()

    expect(await db.thoughtRecords.get(id)).toEqual({
      ...before,
      test: {
        status: 'planned',
        plan: 'Say hello to two people on Monday',
        prediction: 'Nobody will answer',
      },
    })
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('announces it politely, and keeps focus on the plan button, where it stays', async () => {
    await openPlan()
    await savePlan()

    expect(await screen.findByText('Test planned.')).toBeInTheDocument()
    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Revise the plan' })).toHaveFocus()
    })
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(within(testPart()).getByRole('button', { name: 'Revise the plan' })).toHaveFocus()
  })

  it('does not need a challenge first, and leaves a challenge alone', async () => {
    await openRecordScreen(id)

    expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toBeEnabled()
  })

  it('saves once when Save is tapped twice', async () => {
    const put = vi.spyOn(db.thoughtRecords, 'put')

    await openPlan()
    type(PLAN_LABEL, 'Say hello')
    advance()
    type(PREDICTION_LABEL, 'Nobody will answer')

    const button = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(button)
    fireEvent.click(button)
    await planClosed()

    expect(put).toHaveBeenCalledTimes(1)
  })

  it('shows a calm message and keeps everything typed when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const before = await db.thoughtRecords.get(id)

    vi.spyOn(db.thoughtRecords, 'put').mockRejectedValue(new Error('storage unavailable'))
    await openPlan()
    type(PLAN_LABEL, 'kept plan')
    advance()
    type(PREDICTION_LABEL, 'kept prediction')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(heading()).toHaveTextContent('Your prediction')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    step(1)

    expect(screen.getByLabelText(PLAN_LABEL)).toHaveValue('kept plan')

    step(2)

    expect(screen.getByLabelText(PREDICTION_LABEL)).toHaveValue('kept prediction')

    vi.restoreAllMocks()
    expect(await db.thoughtRecords.get(id)).toEqual(before)
  })
})

describe('revising a plan', () => {
  beforeEach(async () => {
    await saveThoughtTest(id, {
      status: 'planned',
      plan: 'Say hello to two people on Monday',
      prediction: 'Nobody will answer',
    })
  })

  async function openRevision(): Promise<void> {
    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the plan' }))
  }

  it('opens the flow filled with the plan, with both steps reachable', async () => {
    await openRevision()

    expect(screen.getByLabelText(PLAN_LABEL)).toHaveValue('Say hello to two people on Monday')
    expect(screen.getByRole('button', { name: /^Step 2:/ })).not.toHaveAttribute('aria-disabled')

    step(2)

    expect(screen.getByLabelText(PREDICTION_LABEL)).toHaveValue('Nobody will answer')
  })

  it('saves the change over the old plan, announces it, and stays planned', async () => {
    await openRevision()
    step(2)
    type(PREDICTION_LABEL, 'Some people will answer')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await planClosed()

    expect(within(testPart()).getByText('Some people will answer')).toBeInTheDocument()
    expect(within(testPart()).queryByText('Nobody will answer')).not.toBeInTheDocument()
    expect(within(testPart()).getByText('Test planned')).toBeInTheDocument()
    expect(await screen.findByText('Plan updated.')).toBeInTheDocument()
    expect((await db.thoughtRecords.get(id))?.test).toEqual({
      status: 'planned',
      plan: 'Say hello to two people on Monday',
      prediction: 'Some people will answer',
    })
  })

  it('can be saved straight away, since both answers are already there', async () => {
    await openRevision()
    advance()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await planClosed()

    expect((await db.thoughtRecords.get(id))?.test?.plan).toBe('Say hello to two people on Monday')
  })

  it('keeps the old plan when the revision is cancelled', async () => {
    const before = await db.thoughtRecords.get(id)

    await openRevision()
    type(PLAN_LABEL, 'never saved')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await planClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Revise the plan' })).toHaveFocus()
    })
  })
})

describe('closing the plan flow', () => {
  it('closes at once when nothing was entered, and returns focus to Plan a test', async () => {
    const before = await db.thoughtRecords.get(id)

    await openPlan()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await planClosed()

    expect(screen.queryByText('Discard this plan?')).not.toBeInTheDocument()
    expect(await db.thoughtRecords.get(id)).toEqual(before)
    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toHaveFocus()
    })
  })

  it('asks before discarding what was typed, and leaves the record unchanged when discarded', async () => {
    const before = await db.thoughtRecords.get(id)

    await openPlan()
    type(PLAN_LABEL, 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard this plan?')
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(screen.getByLabelText(PLAN_LABEL)).toHaveValue('typed')

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await planClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    expect(screen.queryByText('Test planned.')).not.toBeInTheDocument()
  })

  it('does not ask when what was typed has been cleared again', async () => {
    await openPlan()
    type(PLAN_LABEL, 'typed')
    type(PLAN_LABEL, '')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await planClosed()

    expect(screen.queryByText('Discard this plan?')).not.toBeInTheDocument()
  })
})

describe('one flow at a time with the plan', () => {
  it('switches Edit, Challenge and Delete off while the plan is open, and back on after', async () => {
    await openPlan()

    expect(
      within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
        name: 'Edit',
      }),
    ).toBeDisabled()
    expect(
      within(screen.getByRole('region', { name: 'Challenge' })).getByRole('button', {
        name: 'Challenge this thought',
      }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete this record' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await planClosed()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete this record' })).toBeEnabled()
    })
    expect(
      within(screen.getByRole('region', { name: 'Challenge' })).getByRole('button', {
        name: 'Challenge this thought',
      }),
    ).toBeEnabled()
  })

  it('switches Plan a test off while the record is being edited', async () => {
    await openRecordScreen(id)
    fireEvent.click(
      within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
        name: 'Edit',
      }),
    )

    expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toBeDisabled()
  })

  it('switches Plan a test off while a challenge is open', async () => {
    await openRecordScreen(id)
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Challenge' })).getByRole('button', {
        name: 'Challenge this thought',
      }),
    )

    expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toBeDisabled()
  })

  it('switches Plan a test off while the delete question is open', async () => {
    await openRecordScreen(id)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this record' }))

    expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toBeDisabled()
  })
})

describe('a record deleted while the plan is open', () => {
  it('says so calmly, closes the flow and recreates nothing', async () => {
    await openPlan()
    type(PLAN_LABEL, 'typed')
    await db.thoughtRecords.delete(id)

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Plan a test' })).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})
