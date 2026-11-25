import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const FIRST = new Date(2020, 0, 1, 9, 0).getTime()
const SECOND = new Date(2020, 0, 2, 9, 0).getTime()

let id = 0

/** Shows where the app is and what the history entry carries. */
function Where(): ReactElement {
  const location = useLocation()
  const state: unknown = location.state

  return (
    <p data-testid="where">
      {location.pathname} {JSON.stringify(state)}
    </p>
  )
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (await addThoughtRecord({ ...newThought({ thought: 'remove me' }), createdAt: FIRST })).id
  await addThoughtRecord({ ...newThought({ thought: 'stay here' }), createdAt: SECOND })
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function openScreen(): Promise<void> {
  renderWithProviders(
    <>
      <App />
      <Where />
    </>,
    `/thoughts/${String(id)}`,
  )
  await screen.findByRole('region', { name: 'The thought' })
}

function deleteButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Delete this record' })
}

function ask(): void {
  fireEvent.click(deleteButton())
}

describe('the record screen: deleting', () => {
  it('offers Delete at the bottom of the screen, after the thought and the challenge', async () => {
    await openScreen()

    const challenge = screen.getByRole('region', { name: 'Challenge' })

    expect(
      challenge.compareDocumentPosition(deleteButton()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      within(screen.getByRole('region', { name: 'The thought' })).queryByRole('button', {
        name: /delete/i,
      }),
    ).not.toBeInTheDocument()
  })

  it('asks first, with Keep focused, and Keep leaves the record untouched', async () => {
    await openScreen()
    ask()

    expect(screen.getByText('Delete this record? This cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(2)
    await waitFor(() => {
      expect(deleteButton()).toHaveFocus()
    })
  })

  it('deletes the record when confirmed, and returns to the list', async () => {
    await openScreen()
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Thoughts' })).toBeInTheDocument()
    expect(await db.thoughtRecords.get(id)).toBeUndefined()
    expect(await db.thoughtRecords.count()).toBe(1)
    expect(await screen.findByText('stay here')).toBeInTheDocument()
    expect(screen.queryByText('remove me')).not.toBeInTheDocument()
  })

  it('tells the user on the list how many records are left, and moves focus there', async () => {
    await openScreen()
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('Record deleted. 1 record left.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Thought records' })).toHaveFocus()
    })
  })

  it('says when the last record is gone', async () => {
    await db.thoughtRecords.clear()
    id = (await addThoughtRecord({ ...newThought(), createdAt: FIRST })).id
    await openScreen()
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('Record deleted. No records left.')).toBeInTheDocument()
    expect(await screen.findByText(/no thought records yet/i)).toBeInTheDocument()
  })

  it('clears the note it sent to the list, so a reload does not repeat the announcement', async () => {
    await openScreen()
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    await screen.findByText('Record deleted. 1 record left.')

    await waitFor(() => {
      expect(screen.getByTestId('where')).toHaveTextContent(/^\/thoughts null$/)
    })
  })

  it('deletes the challenge together with the record', async () => {
    await saveThoughtChallenge(id, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
    await openScreen()
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))
    await screen.findByText('Record deleted. 1 record left.')

    const remaining = await db.thoughtRecords.toArray()

    expect(remaining).toHaveLength(1)
    expect(remaining.some((row) => 'challenge' in row)).toBe(false)
  })

  it('shows a calm message, keeps the record and the question, and lets the user retry', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    vi.spyOn(db.thoughtRecords, 'delete').mockRejectedValueOnce(new Error('storage unavailable'))
    await openScreen()
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be deleted/i)
    expect(screen.getByRole('heading', { level: 1, name: 'Thought record' })).toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(2)
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('Record deleted. 1 record left.')).toBeInTheDocument()
    expect(await db.thoughtRecords.get(id)).toBeUndefined()
  })
})

describe('the record screen: one flow at a time with Delete', () => {
  it('switches Delete off while the record is being edited', async () => {
    await openScreen()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
        name: 'Edit',
      }),
    )

    expect(deleteButton()).toBeDisabled()
  })

  it('switches Delete off while a challenge is open', async () => {
    await openScreen()
    fireEvent.click(
      within(screen.getByRole('region', { name: 'Challenge' })).getByRole('button', {
        name: 'Challenge this thought',
      }),
    )

    expect(deleteButton()).toBeDisabled()
  })

  it('switches Edit and Challenge off while the question is open, and back on after Keep', async () => {
    await openScreen()
    ask()

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

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    await waitFor(() => {
      expect(
        within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
          name: 'Edit',
        }),
      ).toBeEnabled()
    })
  })
})
