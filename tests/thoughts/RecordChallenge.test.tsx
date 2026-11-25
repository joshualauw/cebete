import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import { openRecordScreen } from '@tests/helpers/recordScreen'
import { newThought } from '@tests/helpers/thoughts'

const OLDER = new Date(2020, 0, 1, 9, 0).getTime()

const BELIEF_LABEL = 'How strongly do you believe the original thought now?'

let firstId = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  firstId = (
    await addThoughtRecord({
      ...newThought({
        situation: 'Team meeting',
        thought: 'I will fail',
        belief: 9,
        emotions: [
          { emotion: 'anxious', intensity: 8 },
          { emotion: 'sad', intensity: 5 },
        ],
      }),
      createdAt: OLDER,
    })
  ).id
  await saveThoughtChallenge(firstId, {
    evidenceFor: 'I stumbled once',
    evidenceAgainst: 'I prepared well',
    balanced: 'I can cope',
    belief: 4,
    emotions: [
      { emotion: 'anxious', intensity: 3 },
      { emotion: 'sad', intensity: 2 },
    ],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function challengePart(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge' })
}

function thoughtPart(): HTMLElement {
  return screen.getByRole('region', { name: 'The thought' })
}

function flowRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge this thought' })
}

function row(label: string): HTMLElement {
  const element = within(challengePart()).getByText(label).parentElement

  if (element === null) {
    throw new Error(`The row for ${label} has no parent`)
  }

  return element
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

async function flowGone(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Challenge this thought' })).not.toBeInTheDocument()
  })
}

describe('a saved challenge', () => {
  it('shows every part and the before and now, read-only', async () => {
    await openRecordScreen(firstId)

    const part = within(challengePart())

    expect(part.getByText('I stumbled once')).toBeInTheDocument()
    expect(part.getByText('I prepared well')).toBeInTheDocument()
    expect(part.getByText('I can cope')).toBeInTheDocument()
    expect(row('Belief in the thought')).toHaveTextContent('9 → 4')
    expect(row('Anxious')).toHaveTextContent('8 → 3')
    expect(row('Sad')).toHaveTextContent('5 → 2')
    expect(part.queryByRole('textbox')).not.toBeInTheDocument()
    expect(part.queryByRole('slider')).not.toBeInTheDocument()
    expect(part.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('leaves out the evidence that was not given', async () => {
    await saveThoughtChallenge(firstId, {
      balanced: 'only this',
      belief: 4,
      emotions: [
        { emotion: 'anxious', intensity: 3 },
        { emotion: 'sad', intensity: 2 },
      ],
    })
    await openRecordScreen(firstId)

    expect(within(challengePart()).queryByText('What speaks for it')).not.toBeInTheDocument()
    expect(within(challengePart()).queryByText('What speaks against it')).not.toBeInTheDocument()
    expect(within(challengePart()).getByText('only this')).toBeInTheDocument()
  })
})

describe('revising a challenge', () => {
  async function openRevision(): Promise<void> {
    await openRecordScreen(firstId)
    fireEvent.click(within(challengePart()).getByRole('button', { name: 'Revise challenge' }))
  }

  it('opens the challenge flow filled with the saved challenge, with every step reachable', async () => {
    await openRevision()

    expect(within(flowRegion()).getByText('Challenge · Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByLabelText('What speaks for this thought?')).toHaveValue('I stumbled once')
    for (const number of [1, 2, 3, 4, 5]) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) }),
      ).not.toHaveAttribute('aria-disabled')
    }

    step(2)

    expect(screen.getByLabelText('What speaks against this thought?')).toHaveValue(
      'I prepared well',
    )

    step(3)

    expect(screen.getByLabelText('What would be a more balanced thought?')).toHaveValue(
      'I can cope',
    )

    step(4)

    expect(screen.getByLabelText(BELIEF_LABEL)).toHaveValue('4')

    step(5)

    expect(screen.getByLabelText('Anxious intensity')).toHaveValue('3')
    expect(screen.getByLabelText('Sad intensity')).toHaveValue('2')
  })

  it('shows the thought as one line, and the record as it was captured, not the saved challenge', async () => {
    await openRevision()

    expect(within(flowRegion()).getByText('I will fail')).toBeInTheDocument()
    expect(within(thoughtPart()).getByText('Team meeting')).toBeInTheDocument()
    expect(thoughtPart().textContent).toContain('9/10')
    expect(thoughtPart().textContent).toContain('8/10')
    expect(thoughtPart().textContent).not.toContain('4/10')
  })

  it('saves over the old challenge, and the screen and the list show the change', async () => {
    await openRevision()
    step(3)
    type('What would be a more balanced thought?', 'a better balanced thought')
    step(4)
    fireEvent.change(screen.getByLabelText(BELIEF_LABEL), { target: { value: '1' } })
    step(5)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await flowGone()

    expect(
      await within(challengePart()).findByText('a better balanced thought'),
    ).toBeInTheDocument()
    expect(row('Belief in the thought')).toHaveTextContent('9 → 1')
    expect(within(challengePart()).queryByText('I can cope')).not.toBeInTheDocument()
    expect(screen.getByText('Challenge saved.')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        within(challengePart()).getByRole('button', { name: 'Revise challenge' }),
      ).toHaveFocus()
    })
    expect(await db.thoughtRecords.count()).toBe(1)

    fireEvent.click(screen.getByRole('link', { name: 'Back to thoughts' }))

    const card = (await screen.findByText('Challenged')).closest('li')

    expect(card).toHaveTextContent('I will fail')
    expect(card).not.toHaveTextContent('→')
  })

  it('keeps the old challenge when the revision is cancelled', async () => {
    const before = await db.thoughtRecords.get(firstId)

    await openRevision()
    step(3)
    type('What would be a more balanced thought?', 'never saved')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.getByRole('heading', { level: 2, name: 'Discard this challenge?' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await flowGone()

    expect(await db.thoughtRecords.get(firstId)).toEqual(before)
    expect(within(challengePart()).getByText('I can cope')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        within(challengePart()).getByRole('button', { name: 'Revise challenge' }),
      ).toHaveFocus()
    })
  })

  it('closes a revision with nothing changed without asking', async () => {
    await openRevision()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await flowGone()

    expect(screen.queryByText('Discard this challenge?')).not.toBeInTheDocument()
  })

  it('can go on to Save straight away, since every required answer is already there', async () => {
    await openRevision()
    advance()
    advance()
    advance()
    advance()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await flowGone()

    expect((await db.thoughtRecords.get(firstId))?.challenge?.balanced).toBe('I can cope')
  })
})

describe('editing the feelings of a challenged record', () => {
  async function editFeelings(change: () => void): Promise<void> {
    await openRecordScreen(firstId)
    fireEvent.click(within(thoughtPart()).getByRole('button', { name: 'Edit' }))
    step(2)
    change()
    step(6)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Edit thought record' })).not.toBeInTheDocument()
    })
  }

  it('keeps the challenge when other parts are edited', async () => {
    await openRecordScreen(firstId)
    fireEvent.click(within(thoughtPart()).getByRole('button', { name: 'Edit' }))
    step(4)
    type('What went through your mind?', 'I might fail')
    step(6)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await screen.findByRole('region', { name: 'The thought' })

    expect(await within(thoughtPart()).findByText('I might fail')).toBeInTheDocument()
    expect(within(challengePart()).getByText('I can cope')).toBeInTheDocument()
  })

  it('keeps the challenge rating of a feeling that remains, and shows a new one at its own rating', async () => {
    await editFeelings(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Tired' }))
    })

    await waitFor(() => {
      expect(row('Tired')).toHaveTextContent('5 → 5')
    })
    expect(row('Anxious')).toHaveTextContent('8 → 3')
    expect(within(challengePart()).queryByText('Sad')).not.toBeInTheDocument()
    expect((await db.thoughtRecords.get(firstId))?.challenge?.emotions).toEqual([
      { emotion: 'anxious', intensity: 3 },
      { emotion: 'tired', intensity: 5 },
    ])
  })

  it('never shows a rating for a feeling the record no longer has', async () => {
    await editFeelings(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
    })

    await waitFor(() => {
      expect(within(challengePart()).queryByText('Anxious')).not.toBeInTheDocument()
    })
    expect(row('Sad')).toHaveTextContent('5 → 2')
  })
})
