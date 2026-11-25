import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { formatEntryTime } from '@/mood/format'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { addThoughtRecord, listThoughtRecords } from '@/thoughts/repository'
import type { NewThoughtRecord } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const FIRST = new Date(2020, 0, 1, 9, 0).getTime()
const SECOND = new Date(2020, 0, 2, 9, 0).getTime()

async function addAt(time: number, record: NewThoughtRecord = newThought()): Promise<number> {
  return (await addThoughtRecord({ ...record, createdAt: time })).id
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function cards(): HTMLElement[] {
  return screen.getAllByRole('listitem')
}

describe('ThoughtsScreen', () => {
  it('has the Thoughts heading and a calm line that it is not professional care', async () => {
    renderWithProviders(<ThoughtsScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'Thoughts' })).toBeInTheDocument()
    expect(screen.getByText(/not a substitute for professional care/i)).toBeInTheDocument()
    await screen.findByText(/no thought records yet/i)
  })

  it('shows a friendly empty state when there are no records', async () => {
    renderWithProviders(<ThoughtsScreen />)

    expect(
      await screen.findByRole('heading', { name: 'No thought records yet' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('shows nothing, not the empty state, while the first read is under way', () => {
    renderWithProviders(<ThoughtsScreen />)

    expect(screen.queryByText(/no thought records yet/i)).not.toBeInTheDocument()
  })
})

describe('ThoughtRecordList: a card', () => {
  it('shows the situation, the thought, the feelings with ratings, the belief and the time', async () => {
    await addAt(
      FIRST,
      newThought({
        situation: 'Team meeting',
        thought: 'I will fail',
        belief: 8,
        emotions: [
          { emotion: 'anxious', intensity: 7 },
          { emotion: 'sad', intensity: 3 },
        ],
      }),
    )
    renderWithProviders(<ThoughtsScreen />)

    const card = await screen.findByRole('listitem')
    const view = within(card)

    expect(view.getByText('Team meeting')).toBeInTheDocument()
    expect(view.getByText('I will fail')).toBeInTheDocument()
    expect(view.getByText('Anxious')).toBeInTheDocument()
    expect(view.getByText('Sad')).toBeInTheDocument()
    expect(card.textContent).toContain('7/10')
    expect(card.textContent).toContain('3/10')
    expect(view.getByText('8/10')).toBeInTheDocument()
    expect(view.getByText(formatEntryTime(FIRST))).toBeInTheDocument()
  })

  it('shows no situation line when the record has none', async () => {
    await addAt(FIRST, newThought({ thought: 'only a thought' }))
    renderWithProviders(<ThoughtsScreen />)

    const card = await screen.findByRole('listitem')

    expect(card.textContent).toContain('only a thought')
    expect(card.querySelectorAll('p')[0]).toHaveTextContent('only a thought')
  })

  it('lists the records newest first', async () => {
    await addAt(FIRST, newThought({ thought: 'older one' }))
    await addAt(SECOND, newThought({ thought: 'newer one' }))
    renderWithProviders(<ThoughtsScreen />)

    await screen.findAllByRole('listitem')

    expect(cards()[0]).toHaveTextContent('newer one')
    expect(cards()[1]).toHaveTextContent('older one')
  })

  it('updates by itself when a record is added or removed in the background', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await screen.findByText(/no thought records yet/i)

    await addAt(FIRST, newThought({ thought: 'arrived later' }))

    expect(await screen.findByText('arrived later')).toBeInTheDocument()
  })
})

describe('ThoughtRecordList: deleting', () => {
  it('asks first, and Keep leaves the record untouched', async () => {
    await addAt(FIRST, newThought({ thought: 'keep me' }))
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /^Delete the thought record/ }))

    expect(screen.getByText('Delete this record? This cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument()
    expect(await listThoughtRecords()).toHaveLength(1)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^Delete the thought record/ })).toHaveFocus()
    })
  })

  it('removes the record when confirmed, and announces it', async () => {
    await addAt(FIRST, newThought({ thought: 'remove me' }))
    await addAt(SECOND, newThought({ thought: 'stay here' }))
    renderWithProviders(<ThoughtsScreen />)
    await screen.findAllByRole('listitem')

    fireEvent.click(screen.getByRole('button', { name: /^Delete the thought record “remove me”/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(screen.queryByText('remove me')).not.toBeInTheDocument()
    })
    expect(screen.getByText('stay here')).toBeInTheDocument()
    expect(screen.getByText('Record deleted. 1 record left.')).toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('says when the last record is gone', async () => {
    await addAt(FIRST)
    renderWithProviders(<ThoughtsScreen />)

    fireEvent.click(await screen.findByRole('button', { name: /^Delete the thought record/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('Record deleted. No records left.')).toBeInTheDocument()
    expect(await screen.findByText(/no thought records yet/i)).toBeInTheDocument()
  })

  it('names each Delete action after a short form of its record', async () => {
    await addAt(FIRST, newThought({ thought: 'a'.repeat(100) }))
    renderWithProviders(<ThoughtsScreen />)

    const button = await screen.findByRole('button', { name: /^Delete the thought record/ })

    expect(button.getAttribute('aria-label')).toContain('…')
    expect(button.getAttribute('aria-label')?.length).toBeLessThan(120)
  })
})
