import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const HAPPENED = new Date(2020, 0, 1, 9, 0, 30, 456).getTime()
const BELIEF_LABEL = 'How strongly do you believe the original thought now?'

let id = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (
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
      createdAt: HAPPENED,
    })
  ).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

function thoughtPart(): HTMLElement {
  return screen.getByRole('region', { name: 'The thought' })
}

function challengePart(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge' })
}

function editRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Edit thought record' })
}

function challengeRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge this thought' })
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

async function openScreen(): Promise<void> {
  renderWithProviders(<App />, `/thoughts/${String(id)}`)
  await screen.findByRole('region', { name: 'The thought' })
}

async function openEdit(): Promise<void> {
  await openScreen()
  fireEvent.click(within(thoughtPart()).getByRole('button', { name: 'Edit' }))
}

async function openChallenge(): Promise<void> {
  await openScreen()
  fireEvent.click(within(challengePart()).getByRole('button', { name: 'Challenge this thought' }))
}

async function editClosed(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Edit thought record' })).not.toBeInTheDocument()
  })
}

async function challengeClosed(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Challenge this thought' })).not.toBeInTheDocument()
  })
}

async function saveChallenge(): Promise<void> {
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
  await challengeClosed()
}

describe('the record screen: editing', () => {
  it('offers Edit on the thought, and opens the steps in place of that part only', async () => {
    await openEdit()

    expect(within(editRegion()).getByText('Edit record · Step 1 of 6')).toBeInTheDocument()
    expect(within(editRegion()).getByRole('heading', { level: 2 })).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'The thought' })).not.toBeInTheDocument()
    expect(challengePart()).toBeInTheDocument()
  })

  it('fills the steps with the record', async () => {
    await openEdit()

    expect(screen.getByLabelText('What was happening?')).toHaveValue('Team meeting')
    step(4)
    expect(screen.getByLabelText('What went through your mind?')).toHaveValue('I will fail')
    step(5)
    expect(screen.getByLabelText('How strongly do you believe this thought?')).toHaveValue('9')
  })

  it('saves the changes, shows them, announces them and returns focus to Edit', async () => {
    await openEdit()
    step(4)
    type('What went through your mind?', 'I might manage')
    step(6)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await editClosed()

    expect(within(thoughtPart()).getByText('I might manage')).toBeInTheDocument()
    expect(await screen.findByText('Record updated.')).toBeInTheDocument()
    await waitFor(() => {
      expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toHaveFocus()
    })
    expect((await db.thoughtRecords.get(id))?.thought).toBe('I might manage')
  })

  it('keeps the time exactly when it was not touched', async () => {
    await openEdit()
    step(4)
    type('What went through your mind?', 'I might manage')
    step(6)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await editClosed()

    expect((await db.thoughtRecords.get(id))?.createdAt).toBe(HAPPENED)
  })

  it('keeps the challenge the record already has', async () => {
    await saveThoughtChallenge(id, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [
        { emotion: 'anxious', intensity: 3 },
        { emotion: 'sad', intensity: 2 },
      ],
    })
    await openEdit()
    step(4)
    type('What went through your mind?', 'I might manage')
    step(6)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await editClosed()

    expect(within(challengePart()).getByText('I can cope')).toBeInTheDocument()
  })

  it('closes at once, and returns focus to Edit, when nothing was changed', async () => {
    await openEdit()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await editClosed()

    expect(screen.queryByText('Discard this record?')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toHaveFocus()
    })
  })

  it('asks before discarding a change, and leaves the record as it was when discarded', async () => {
    const before = await db.thoughtRecords.get(id)

    await openEdit()
    step(4)
    type('What went through your mind?', 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Discard this record?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await editClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    expect(screen.queryByText('Record updated.')).not.toBeInTheDocument()
  })

  it('shows a calm message and keeps what was typed when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const before = await db.thoughtRecords.get(id)

    await openEdit()
    step(4)
    type('What went through your mind?', 'kept text')
    step(6)
    vi.spyOn(db.thoughtRecords, 'put').mockRejectedValue(new Error('storage unavailable'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    step(4)
    expect(screen.getByLabelText('What went through your mind?')).toHaveValue('kept text')

    vi.restoreAllMocks()
    expect(await db.thoughtRecords.get(id)).toEqual(before)
  })
})

describe('the record screen: challenging', () => {
  it('offers a prominent Challenge this thought, and opens the steps in place of that part only', async () => {
    await openChallenge()

    expect(within(challengeRegion()).getByText('Challenge · Step 1 of 5')).toBeInTheDocument()
    expect(within(challengeRegion()).getByRole('heading', { level: 2 })).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Challenge' })).not.toBeInTheDocument()
    expect(thoughtPart()).toBeInTheDocument()
    expect(within(thoughtPart()).getByText('I will fail')).toBeInTheDocument()
  })

  it('saves the challenge, shows it with its before and now, and announces it', async () => {
    await openChallenge()
    await saveChallenge()

    const part = within(challengePart())

    expect(part.getByText('I can cope')).toBeInTheDocument()
    expect(part.getByText('I stumbled once')).toBeInTheDocument()
    expect(part.getByText('I prepared well')).toBeInTheDocument()
    expect(part.getByText('From 9 to 4 out of 10')).toBeInTheDocument()
    expect(part.getByText('From 8 to 3 out of 10')).toBeInTheDocument()
    expect(part.getByText('From 5 to 2 out of 10')).toBeInTheDocument()
    expect(await screen.findByText('Challenge saved.')).toBeInTheDocument()
  })

  it('stores the challenge on the same record and changes nothing else in it', async () => {
    const before = await db.thoughtRecords.get(id)

    await openChallenge()
    await saveChallenge()

    const after = await db.thoughtRecords.get(id)

    expect(after).toEqual({
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
        challengedAt: after?.challenge?.challengedAt,
      },
    })
    expect(after?.challenge?.challengedAt).toBeTypeOf('number')
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('turns the button into Revise challenge and keeps focus on it', async () => {
    await openChallenge()
    await saveChallenge()

    await waitFor(() => {
      expect(
        within(challengePart()).getByRole('button', { name: 'Revise challenge' }),
      ).toHaveFocus()
    })
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(within(challengePart()).getByRole('button', { name: 'Revise challenge' })).toHaveFocus()
    expect(
      within(challengePart()).queryByRole('button', { name: 'Challenge this thought' }),
    ).not.toBeInTheDocument()
  })

  it('revises a saved challenge from its saved values, and shows the revision', async () => {
    await openChallenge()
    await saveChallenge()

    fireEvent.click(within(challengePart()).getByRole('button', { name: 'Revise challenge' }))

    expect(screen.getByLabelText('What speaks for this thought?')).toHaveValue('I stumbled once')
    step(3)
    expect(screen.getByLabelText('What would be a more balanced thought?')).toHaveValue(
      'I can cope',
    )
    type('What would be a more balanced thought?', 'I can learn')
    step(5)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await challengeClosed()

    expect(within(challengePart()).getByText('I can learn')).toBeInTheDocument()
    expect(within(challengePart()).queryByText('I can cope')).not.toBeInTheDocument()
  })

  it('closes at once when nothing was entered, leaving the record as it was', async () => {
    const before = await db.thoughtRecords.get(id)

    await openChallenge()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await challengeClosed()

    expect(screen.queryByText('Discard this challenge?')).not.toBeInTheDocument()
    expect(await db.thoughtRecords.get(id)).toEqual(before)
    await waitFor(() => {
      expect(
        within(challengePart()).getByRole('button', { name: 'Challenge this thought' }),
      ).toHaveFocus()
    })
  })

  it('asks before discarding what was typed, and leaves the record unchanged when discarded', async () => {
    const before = await db.thoughtRecords.get(id)

    await openChallenge()
    type('What speaks for this thought?', 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('heading', { name: 'Discard this challenge?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await challengeClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    expect(screen.queryByText('Challenge saved.')).not.toBeInTheDocument()
  })

  it('shows a calm message and keeps what was typed when saving fails', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await openChallenge()
    advance()
    advance()
    type('What would be a more balanced thought?', 'kept text')
    step(5)
    vi.spyOn(db.thoughtRecords, 'put').mockRejectedValue(new Error('storage unavailable'))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    step(3)
    expect(screen.getByLabelText('What would be a more balanced thought?')).toHaveValue('kept text')
  })
})

describe('the record screen: one flow at a time', () => {
  it('switches Challenge off while the record is being edited, and back on when it closes', async () => {
    await openEdit()

    expect(
      within(challengePart()).getByRole('button', { name: 'Challenge this thought' }),
    ).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await editClosed()

    await waitFor(() => {
      expect(
        within(challengePart()).getByRole('button', { name: 'Challenge this thought' }),
      ).toBeEnabled()
    })
  })

  it('switches Edit off while a challenge is open, and back on when it closes', async () => {
    await openChallenge()

    expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await challengeClosed()

    await waitFor(() => {
      expect(within(thoughtPart()).getByRole('button', { name: 'Edit' })).toBeEnabled()
    })
  })
})

describe('the record screen: a record deleted while a flow is open', () => {
  it('says so calmly, closes the flow and recreates nothing', async () => {
    await openChallenge()
    type('What speaks for this thought?', 'typed')
    await db.thoughtRecords.delete(id)

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Challenge this thought' })).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})
