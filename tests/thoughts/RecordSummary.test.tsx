import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { formatEntryTime } from '@/mood/format'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import ChallengeFlow from '@/thoughts/ChallengeFlow'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import type { ThoughtRecord } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const OLDER = new Date(2020, 0, 1, 9, 0).getTime()
const NEWER = new Date(2020, 0, 2, 9, 0).getTime()

let fullId = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  fullId = (
    await addThoughtRecord({
      ...newThought({
        situation: 'Team meeting',
        action: 'stayed quiet',
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
  await addThoughtRecord({ ...newThought({ thought: 'a bare thought' }), createdAt: NEWER })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function toggle(): HTMLElement {
  return screen.getByRole('button', { name: /^(See the whole record|Hide the record)$/ })
}

function wholeRecord(): HTMLElement {
  return screen.getByRole('region', { name: 'The whole record' })
}

async function openChallenge(thought: string): Promise<void> {
  renderWithProviders(<ThoughtsScreen />)
  fireEvent.click(
    await screen.findByRole('button', { name: new RegExp(`^Challenge this thought: “${thought}`) }),
  )
}

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function marker(number: number): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) })
}

describe('the record while challenging', () => {
  it('shows the thought on every step, and the whole record is collapsed to begin with', async () => {
    await openChallenge('I will fail')

    expect(toggle()).toHaveTextContent('See the whole record')
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('region', { name: 'The whole record' })).not.toBeInTheDocument()

    advance()
    advance()
    type('What would be a more balanced thought?', 'I can cope')
    advance()
    advance()

    expect(screen.getByText('I will fail')).toBeInTheDocument()
    expect(screen.queryByText('Team meeting')).not.toBeInTheDocument()
  })

  it('shows the other five parts as they were captured when opened', async () => {
    await openChallenge('I will fail')
    fireEvent.click(toggle())

    const record = within(wholeRecord())

    expect(record.getByText('Team meeting')).toBeInTheDocument()
    expect(record.getByText('Anxious 8/10')).toBeInTheDocument()
    expect(record.getByText('Sad 5/10')).toBeInTheDocument()
    expect(record.getByText('stayed quiet')).toBeInTheDocument()
    expect(record.getByText('9/10')).toBeInTheDocument()
    expect(record.getByText(formatEntryTime(OLDER))).toBeInTheDocument()
    expect(screen.getByText('I will fail')).toBeInTheDocument()
  })

  it('announces whether it is expanded, names the area it opens, and changes its label', async () => {
    await openChallenge('I will fail')
    fireEvent.click(toggle())

    expect(toggle()).toHaveTextContent('Hide the record')
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(toggle()).toHaveAttribute('aria-controls', wholeRecord().id)

    fireEvent.click(toggle())

    expect(toggle()).toHaveTextContent('See the whole record')
    expect(toggle()).toHaveAttribute('aria-expanded', 'false')
    expect(toggle()).not.toHaveAttribute('aria-controls')
  })

  it('leaves out a situation and a "what you did" that the record does not have', async () => {
    await openChallenge('a bare thought')
    fireEvent.click(toggle())

    const record = within(wholeRecord())

    expect(record.queryByText('The situation')).not.toBeInTheDocument()
    expect(record.queryByText('What you did')).not.toBeInTheDocument()
    expect(record.getByText('Anxious 7/10')).toBeInTheDocument()
    expect(record.getByText('When it happened')).toBeInTheDocument()
  })

  it('stays open when moving with Next, Back and the markers', async () => {
    await openChallenge('I will fail')
    fireEvent.click(toggle())
    advance()

    expect(wholeRecord()).toBeInTheDocument()

    advance()
    type('What would be a more balanced thought?', 'I can cope')
    fireEvent.click(marker(5))

    expect(wholeRecord()).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    fireEvent.click(marker(1))

    expect(wholeRecord()).toBeInTheDocument()
    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
  })

  it('stays collapsed when it was collapsed, across the steps', async () => {
    await openChallenge('I will fail')
    advance()
    advance()

    expect(screen.queryByRole('region', { name: 'The whole record' })).not.toBeInTheDocument()
  })

  it('is hidden during the discard question, and still open after Keep editing', async () => {
    await openChallenge('I will fail')
    fireEvent.click(toggle())
    type('What speaks for this thought?', 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.queryByRole('button', { name: /whole record|Hide the record/ }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'The whole record' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(toggle()).toHaveAttribute('aria-expanded', 'true')
    expect(wholeRecord()).toBeInTheDocument()
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
    fireEvent.click(marker(5))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer exists/i)
    expect(screen.queryByText('already deleted elsewhere')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /whole record|Hide the record/ }),
    ).not.toBeInTheDocument()
  })
})

describe('the record while revising a challenge', () => {
  beforeEach(async () => {
    await saveThoughtChallenge(fullId, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [
        { emotion: 'anxious', intensity: 3 },
        { emotion: 'sad', intensity: 2 },
      ],
    })
  })

  async function openRevision(): Promise<void> {
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /^View challenge: “I will fail/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Revise challenge' }))
  }

  it('shows the thought, and the original record rather than the saved challenge', async () => {
    await openRevision()

    expect(screen.getByText('I will fail')).toBeInTheDocument()

    fireEvent.click(toggle())

    const record = within(wholeRecord())

    expect(record.getByText('9/10')).toBeInTheDocument()
    expect(record.getByText('Anxious 8/10')).toBeInTheDocument()
    expect(record.getByText('Sad 5/10')).toBeInTheDocument()
    expect(record.queryByText('Anxious 3/10')).not.toBeInTheDocument()
    expect(record.queryByText('4/10')).not.toBeInTheDocument()
  })

  it('stays open across the steps of a revision', async () => {
    await openRevision()
    fireEvent.click(toggle())
    fireEvent.click(marker(4))
    fireEvent.click(marker(5))

    expect(wholeRecord()).toBeInTheDocument()
  })
})

describe('the capture and edit flows', () => {
  it('show no such summary, since they change the record rather than remember it', async () => {
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(await screen.findByRole('button', { name: 'New thought record' }))

    expect(
      screen.queryByRole('button', { name: /whole record|Hide the record/ }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(await screen.findByRole('button', { name: /^Edit the thought record “a bare/ }))

    expect(
      screen.queryByRole('button', { name: /whole record|Hide the record/ }),
    ).not.toBeInTheDocument()
  })
})

describe('the read-only View challenge', () => {
  async function openView(): Promise<void> {
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /^View challenge: “/ }))
  }

  const challenge = {
    balanced: 'I can cope',
    belief: 4,
  }

  it('shows what the user did when there is something, and never when it happened', async () => {
    await saveThoughtChallenge(fullId, {
      ...challenge,
      emotions: [
        { emotion: 'anxious', intensity: 3 },
        { emotion: 'sad', intensity: 2 },
      ],
    })
    await openView()

    const view = within(screen.getByRole('region', { name: 'Your challenge' }))

    expect(view.getByText('What you did')).toBeInTheDocument()
    expect(view.getByText('stayed quiet')).toBeInTheDocument()
    expect(view.queryByText('When it happened')).not.toBeInTheDocument()
    expect(view.queryByText(formatEntryTime(OLDER))).not.toBeInTheDocument()
  })

  it('shows nothing for what the user did when the record has none', async () => {
    const bare = (await db.thoughtRecords.toArray()).find(
      (record) => record.thought === 'a bare thought',
    )

    expect(bare).toBeDefined()
    await saveThoughtChallenge(bare?.id ?? 0, {
      ...challenge,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
    await openView()

    const view = within(screen.getByRole('region', { name: 'Your challenge' }))

    expect(view.queryByText('What you did')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(view.getByText('a bare thought')).toBeInTheDocument()
    })
  })
})

function type(label: string, text: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } })
}
