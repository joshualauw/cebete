import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { db } from '@/db/db'
import { formatEntryTime } from '@/mood/format'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import type { NewThoughtRecord } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const HAPPENED = new Date(2020, 0, 1, 9, 0).getTime()

async function addRecord(extra: Partial<NewThoughtRecord> = {}): Promise<number> {
  return (await addThoughtRecord({ ...newThought(extra), createdAt: HAPPENED })).id
}

async function challenge(id: number): Promise<void> {
  await saveThoughtChallenge(id, {
    evidenceFor: 'I have stumbled before',
    evidenceAgainst: 'I have prepared well',
    balanced: 'I may stumble, but I can recover',
    belief: 4,
    emotions: [{ emotion: 'anxious', intensity: 3 }],
  })
}

function thoughtPart(): HTMLElement {
  return screen.getByRole('region', { name: 'The thought' })
}

function challengePart(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge' })
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ThoughtRecordScreen: the thought', () => {
  it('shows the whole record as it was captured', async () => {
    const id = await addRecord({
      situation: 'Team meeting',
      thought: 'I will fail',
      action: 'I stayed quiet',
      belief: 8,
      emotions: [
        { emotion: 'anxious', intensity: 7 },
        { emotion: 'sad', intensity: 3 },
      ],
    })
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    expect(await screen.findByRole('heading', { level: 1, name: 'Thought record' })).toBeVisible()

    const part = within(thoughtPart())

    expect(part.getByText('Team meeting')).toBeInTheDocument()
    expect(part.getByText('I will fail')).toBeInTheDocument()
    expect(part.getByText('Anxious')).toBeInTheDocument()
    expect(part.getByText('Sad')).toBeInTheDocument()
    expect(thoughtPart().textContent).toContain('7/10')
    expect(thoughtPart().textContent).toContain('3/10')
    expect(part.getByText('I stayed quiet')).toBeInTheDocument()
    expect(part.getByText('Belief in the thought')).toBeInTheDocument()
    expect(thoughtPart().textContent).toContain('8/10')
    expect(part.getByText(formatEntryTime(HAPPENED))).toBeInTheDocument()
  })

  it('leaves out the situation and what the user did when the record has none', async () => {
    const id = await addRecord()
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    await screen.findByRole('region', { name: 'The thought' })

    expect(screen.queryByText('The situation')).not.toBeInTheDocument()
    expect(screen.queryByText('What you did')).not.toBeInTheDocument()
  })

  it('moves focus to the heading once the record is shown', async () => {
    const id = await addRecord()
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    const heading = await screen.findByRole('heading', { level: 1, name: 'Thought record' })

    await waitFor(() => {
      expect(heading).toHaveFocus()
    })
  })

  it('keeps Thoughts highlighted in the bottom bar', async () => {
    const id = await addRecord()
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    await screen.findByRole('region', { name: 'The thought' })

    expect(screen.getByRole('link', { name: 'Thoughts' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })
})

describe('ThoughtRecordScreen: the challenge', () => {
  it('invites the user to challenge a thought that has no challenge yet', async () => {
    const id = await addRecord()
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    await screen.findByRole('region', { name: 'Challenge' })

    expect(within(challengePart()).getByText(/has not been challenged yet/i)).toBeInTheDocument()
    expect(screen.queryByText('Before and now')).not.toBeInTheDocument()
  })

  it('shows the evidence, the balanced thought and the ratings before and now', async () => {
    const id = await addRecord()
    await challenge(id)
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    await screen.findByText('I may stumble, but I can recover')

    const part = within(challengePart())

    expect(part.getByText('I have stumbled before')).toBeInTheDocument()
    expect(part.getByText('I have prepared well')).toBeInTheDocument()
    expect(part.getByText('Before and now')).toBeInTheDocument()
    expect(part.getByText('From 8 to 4 out of 10')).toBeInTheDocument()
    expect(part.getByText('From 7 to 3 out of 10')).toBeInTheDocument()
    expect(part.queryByText(/has not been challenged yet/i)).not.toBeInTheDocument()
  })

  it('leaves out evidence the challenge does not have', async () => {
    const id = await addRecord()
    await saveThoughtChallenge(id, {
      balanced: 'I can cope',
      belief: 5,
      emotions: [{ emotion: 'anxious', intensity: 5 }],
    })
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    await screen.findByText('I can cope')

    expect(screen.queryByText('What speaks for it')).not.toBeInTheDocument()
    expect(screen.queryByText('What speaks against it')).not.toBeInTheDocument()
  })
})

describe('ThoughtRecordScreen: going back', () => {
  it('offers a way back to the list', async () => {
    const id = await addRecord({ thought: 'I will fail' })
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    await screen.findByRole('region', { name: 'The thought' })
    fireEvent.click(screen.getByRole('link', { name: 'Back to thoughts' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Thoughts' })).toBeInTheDocument()
  })
})

describe('ThoughtRecordScreen: a record that is not there', () => {
  it('says so calmly and offers the way back, for an id that was never saved', async () => {
    renderWithProviders(<App />, '/thoughts/404')

    expect(await screen.findByRole('status')).toHaveTextContent(/could not be found/i)
    expect(screen.getByRole('heading', { level: 1, name: 'Thought record' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to thoughts' })).toHaveAttribute(
      'href',
      '/thoughts',
    )
  })

  it.each(['abc', '0', '-3', '1.5', '99999999999999999999'])(
    'says so calmly for the address /thoughts/%s',
    async (id) => {
      renderWithProviders(<App />, `/thoughts/${id}`)

      expect(await screen.findByRole('status')).toHaveTextContent(/could not be found/i)
    },
  )

  it('says so for a stored row that cannot be read as a record, and leaves the row alone', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const id: unknown = await db.table('thoughtRecords').add({ createdAt: 1, thought: 'damaged' })

    expect(typeof id).toBe('number')

    if (typeof id !== 'number') {
      return
    }

    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    expect(await screen.findByRole('status')).toHaveTextContent(/could not be found/i)
    expect(await db.table('thoughtRecords').get(id)).toBeDefined()
  })

  it('says so when the record is deleted while it is open', async () => {
    const id = await addRecord()
    renderWithProviders(<App />, `/thoughts/${String(id)}`)

    await screen.findByRole('region', { name: 'The thought' })
    await db.thoughtRecords.delete(id)

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'The thought' })).not.toBeInTheDocument()
  })
})
