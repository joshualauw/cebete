import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import ChallengeFlow from '@/thoughts/ChallengeFlow'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import type { ThoughtRecord } from '@/thoughts/types'
import { openRecordScreen } from '@tests/helpers/recordScreen'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const OLDER = new Date(2020, 0, 1, 9, 0).getTime()
const NEWER = new Date(2020, 0, 2, 9, 0).getTime()

const BELIEF_LABEL = 'How strongly do you believe the original thought now?'

let firstId = 0
let secondId = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  firstId = (
    await addThoughtRecord({
      ...newThought({
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
  secondId = (
    await addThoughtRecord({ ...newThought({ thought: 'second thought' }), createdAt: NEWER })
  ).id
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

function heading(): HTMLElement {
  return within(flowRegion()).getByRole('heading', { level: 2 })
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

async function openChallenge(id = firstId): Promise<void> {
  await openRecordScreen(id)
  fireEvent.click(within(challengePart()).getByRole('button', { name: 'Challenge this thought' }))
}

function toBalanced(): void {
  advance()
  advance()
}

async function closed(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Challenge this thought' })).not.toBeInTheDocument()
  })
}

describe('the Challenge this thought button', () => {
  it('shows on a record with no challenge', async () => {
    await openRecordScreen(secondId)

    const button = within(challengePart()).getByRole('button', { name: 'Challenge this thought' })

    expect(button).toBeEnabled()
  })

  it('is replaced by Revise challenge on a record that already has a challenge', async () => {
    await saveThoughtChallenge(firstId, {
      balanced: 'I can cope',
      belief: 3,
      emotions: [
        { emotion: 'anxious', intensity: 2 },
        { emotion: 'sad', intensity: 1 },
      ],
    })
    await openRecordScreen(firstId)

    expect(
      within(challengePart()).queryByRole('button', { name: 'Challenge this thought' }),
    ).not.toBeInTheDocument()
    expect(within(challengePart()).getByRole('button', { name: 'Revise challenge' })).toBeEnabled()
  })
})

describe('the challenge flow', () => {
  it('opens in place of the challenge part, on the first step, with five step markers', async () => {
    await openChallenge()

    expect(flowRegion()).toBeInTheDocument()
    expect(within(flowRegion()).getByText('Challenge · Step 1 of 5')).toBeInTheDocument()
    expect(heading()).toHaveTextContent('What speaks for it')
    expect(heading()).toHaveFocus()
    expect(within(flowRegion()).getAllByRole('listitem')).toHaveLength(5)
    expect(screen.queryByRole('region', { name: 'Challenge' })).not.toBeInTheDocument()
    expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toBeDisabled()
  })

  it('asks the five questions in order', async () => {
    await openChallenge()

    const expected = [
      ['What speaks for it', 'What speaks for this thought?'],
      ['What speaks against it', 'What speaks against this thought?'],
      ['A more balanced thought', 'What would be a more balanced thought?'],
      ['How much you believe it now', BELIEF_LABEL],
      ['How you feel now', 'Anxious intensity'],
    ] as const

    expected.forEach(([title, question], index) => {
      expect(heading()).toHaveTextContent(title)
      expect(screen.getAllByLabelText(question).length).toBeGreaterThan(0)

      if (index === 2) {
        type('What would be a more balanced thought?', 'I can cope')
      }
      if (index < expected.length - 1) {
        advance()
      }
    })
  })

  it('lets the two evidence steps be skipped, and requires the balanced thought', async () => {
    await openChallenge()

    expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()
    advance()
    expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()
    advance()

    expect(heading()).toHaveTextContent('A more balanced thought')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAccessibleDescription(
      'Write a more balanced thought to continue.',
    )
    expect(screen.getByRole('button', { name: /^Step 4:/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )

    type('What would be a more balanced thought?', 'I can cope')

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^Step 5:/ })).not.toHaveAttribute('aria-disabled')
  })

  it('starts the belief at the original rating and the feelings at their original ratings, with only the record’s feelings', async () => {
    await openChallenge()
    toBalanced()
    type('What would be a more balanced thought?', 'I can cope')
    advance()

    expect(screen.getByLabelText(BELIEF_LABEL)).toHaveValue('9')

    advance()

    expect(screen.getByLabelText('Anxious intensity')).toHaveValue('8')
    expect(screen.getByLabelText('Sad intensity')).toHaveValue('5')
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})

describe('the thought while challenging', () => {
  it('stays visible as one line on every step, with no toggle for the rest of the record', async () => {
    await openChallenge()

    for (let step = 0; step < 4; step += 1) {
      expect(within(flowRegion()).getByText('I will fail')).toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: /whole record|Hide the record/ }),
      ).not.toBeInTheDocument()

      if (step === 2) {
        type('What would be a more balanced thought?', 'I can cope')
      }
      advance()
    }

    expect(within(flowRegion()).getByText('I will fail')).toBeInTheDocument()
  })

  it('is hidden during the discard question, and back after Keep editing', async () => {
    await openChallenge()
    type('What speaks for this thought?', 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(within(flowRegion()).queryByText('I will fail')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(within(flowRegion()).getByText('I will fail')).toBeInTheDocument()
  })

  it('is hidden when the record no longer exists', async () => {
    const missing: ThoughtRecord = {
      id: 4242,
      emotions: [{ emotion: 'sad', intensity: 4 }],
      thought: 'already deleted elsewhere',
      belief: 6,
      createdAt: OLDER,
    }

    renderWithProviders(<ChallengeFlow record={missing} onDone={() => undefined} />)
    expect(screen.getByText('already deleted elsewhere')).toBeInTheDocument()

    advance()
    advance()
    type('What would be a more balanced thought?', 'too late')
    fireEvent.click(screen.getByRole('button', { name: /^Step 5:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer exists/i)
    expect(screen.queryByText('already deleted elsewhere')).not.toBeInTheDocument()
  })
})

describe('saving a challenge', () => {
  async function completeChallenge(): Promise<void> {
    type('What speaks for this thought?', 'I stumbled once')
    advance()
    type('What speaks against this thought?', 'I prepared well')
    advance()
    type('What would be a more balanced thought?', 'I can cope')
    advance()
    slider(BELIEF_LABEL, 4)
    advance()
    slider('Anxious intensity', 3)
    slider('Sad intensity', 2)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await closed()
  }

  it('shows the challenge, with the belief before and now, on the record screen', async () => {
    await openChallenge()
    await completeChallenge()

    const part = within(challengePart())

    expect(await part.findByText('I can cope')).toBeInTheDocument()
    expect(part.getByText('From 9 to 4 out of 10')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Challenge this thought' })).not.toBeInTheDocument()
  })

  it('shows the Challenged label, and no belief, on the list', async () => {
    await openChallenge()
    await completeChallenge()

    fireEvent.click(screen.getByRole('link', { name: 'Back to thoughts' }))

    const card = (await screen.findByText('Challenged')).closest('li')

    expect(card).not.toBeNull()
    expect(card).toHaveTextContent('I will fail')
    expect(card).not.toHaveTextContent('→')
    expect(card).not.toHaveTextContent('Belief in the thought')
  })

  it('stores the challenge on the same record and changes nothing else in it', async () => {
    const before = await db.thoughtRecords.get(firstId)

    await openChallenge()
    await completeChallenge()

    expect(await db.thoughtRecords.get(firstId)).toEqual({
      ...before,
      challenge: {
        evidenceFor: 'I stumbled once',
        evidenceAgainst: 'I prepared well',
        balanced: 'I can cope',
        belief: 4,
        emotions: [
          { emotion: 'anxious', intensity: 3 },
          { emotion: 'sad', intensity: 2 },
        ],
      },
    })
    expect(await db.thoughtRecords.count()).toBe(2)
  })

  it('announces it, and returns focus to the Revise challenge button, where it stays', async () => {
    await openChallenge()
    await completeChallenge()

    expect(await screen.findByText('Challenge saved.')).toBeInTheDocument()
    await waitFor(() => {
      expect(
        within(challengePart()).getByRole('button', { name: 'Revise challenge' }),
      ).toHaveFocus()
    })
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(within(challengePart()).getByRole('button', { name: 'Revise challenge' })).toHaveFocus()
  })

  it('saves a challenge with only the balanced thought', async () => {
    await openChallenge()
    toBalanced()
    type('What would be a more balanced thought?', 'just this')
    fireEvent.click(screen.getByRole('button', { name: /^Step 5:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await closed()

    const stored = (await db.thoughtRecords.get(firstId))?.challenge

    expect(stored).toEqual({
      balanced: 'just this',
      belief: 9,
      emotions: [
        { emotion: 'anxious', intensity: 8 },
        { emotion: 'sad', intensity: 5 },
      ],
    })
  })

  it('saves once when Save is tapped twice', async () => {
    const put = vi.spyOn(db.thoughtRecords, 'put')

    await openChallenge()
    toBalanced()
    type('What would be a more balanced thought?', 'I can cope')
    fireEvent.click(screen.getByRole('button', { name: /^Step 5:/ }))

    const button = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(button)
    fireEvent.click(button)
    await closed()

    expect(put).toHaveBeenCalledTimes(1)
  })

  it('shows a calm message and keeps everything typed when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const before = await db.thoughtRecords.get(firstId)

    vi.spyOn(db.thoughtRecords, 'put').mockRejectedValue(new Error('storage unavailable'))
    await openChallenge()
    toBalanced()
    type('What would be a more balanced thought?', 'kept text')
    fireEvent.click(screen.getByRole('button', { name: /^Step 5:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(heading()).toHaveTextContent('How you feel now')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /^Step 3:/ }))

    expect(screen.getByLabelText('What would be a more balanced thought?')).toHaveValue('kept text')

    vi.restoreAllMocks()
    expect(await db.thoughtRecords.get(firstId)).toEqual(before)
  })
})

describe('closing a challenge', () => {
  it('closes at once and leaves the record as it was when nothing was entered', async () => {
    const before = await db.thoughtRecords.get(firstId)

    await openChallenge()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    expect(screen.queryByText('Discard this challenge?')).not.toBeInTheDocument()
    expect(await db.thoughtRecords.get(firstId)).toEqual(before)
    await waitFor(() => {
      expect(
        within(challengePart()).getByRole('button', { name: 'Challenge this thought' }),
      ).toHaveFocus()
    })
  })

  it('asks before discarding what was typed, and leaves the record unchanged when discarded', async () => {
    const before = await db.thoughtRecords.get(firstId)

    await openChallenge()
    type('What speaks for this thought?', 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard this challenge?')
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await closed()

    expect(await db.thoughtRecords.get(firstId)).toEqual(before)
    expect(screen.queryByText('Challenge saved.')).not.toBeInTheDocument()
  })

  it('does not ask when what was typed has been cleared again', async () => {
    await openChallenge()
    type('What speaks for this thought?', 'typed')
    type('What speaks for this thought?', '')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    expect(screen.queryByText('Discard this challenge?')).not.toBeInTheDocument()
  })
})

describe('one flow at a time with the challenge', () => {
  it('switches Edit and Delete off while a challenge is open, and back on when it closes', async () => {
    await openChallenge()

    expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete this record' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await closed()

    await waitFor(() => {
      expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: 'Delete this record' })).toBeEnabled()
  })
})
