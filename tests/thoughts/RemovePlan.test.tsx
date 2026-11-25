import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtTest } from '@/thoughts/repository'
import type { ThoughtTest } from '@/thoughts/types'
import { openRecordScreen } from '@tests/helpers/recordScreen'
import { newThought } from '@tests/helpers/thoughts'

const planned: ThoughtTest = {
  status: 'planned',
  plan: 'Say hello to two people on Monday',
  prediction: 'Nobody will answer',
}

const done: ThoughtTest = { ...planned, status: 'done', result: 'Both answered', belief: 3 }

let id = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (await addThoughtRecord({ ...newThought(), createdAt: 1_000 })).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

function testPart(): HTMLElement {
  return screen.getByRole('region', { name: 'Test' })
}

function removeButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Remove the plan' })
}

function ask(): void {
  fireEvent.click(removeButton())
}

describe('Remove the plan: when it is offered', () => {
  it('is offered for a planned test, below the Test part', async () => {
    await saveThoughtTest(id, planned)
    await openRecordScreen(id)

    expect(removeButton()).toBeEnabled()
    expect(
      testPart().compareDocumentPosition(removeButton()) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('is not offered when there is no test', async () => {
    await openRecordScreen(id)

    expect(screen.queryByRole('button', { name: 'Remove the plan' })).not.toBeInTheDocument()
  })

  it('is not offered once the result is logged, which can only be revised', async () => {
    await saveThoughtTest(id, done)
    await openRecordScreen(id)

    expect(screen.queryByRole('button', { name: 'Remove the plan' })).not.toBeInTheDocument()
  })
})

describe('Remove the plan: the question', () => {
  beforeEach(async () => {
    await saveThoughtTest(id, planned)
  })

  it('asks first, with Keep focused, and Keep leaves the plan untouched', async () => {
    await openRecordScreen(id)
    ask()

    expect(screen.getByText('Remove this plan? This cannot be undone.')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Remove this plan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    expect(screen.queryByText(/cannot be undone/i)).not.toBeInTheDocument()
    expect((await db.thoughtRecords.get(id))?.test).toEqual(planned)
    await waitFor(() => {
      expect(removeButton()).toHaveFocus()
    })
  })

  it('switches every other action off while it is open, and back on after Keep', async () => {
    await openRecordScreen(id)
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
    expect(within(testPart()).getByRole('button', { name: 'Log the result' })).toBeDisabled()
    expect(within(testPart()).getByRole('button', { name: 'Revise the plan' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete this record' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Log the result' })).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: 'Delete this record' })).toBeEnabled()
  })

  it('is switched off while another flow is open', async () => {
    await openRecordScreen(id)
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the plan' }))

    expect(removeButton()).toBeDisabled()
  })
})

describe('Remove the plan: removing', () => {
  beforeEach(async () => {
    await saveThoughtTest(id, planned)
  })

  it('removes the plan, and the Test part returns to its prompt', async () => {
    const before = await db.thoughtRecords.get(id)

    await openRecordScreen(id)
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    await waitFor(() => {
      expect(within(testPart()).getByText(/has not been tested yet/i)).toBeInTheDocument()
    })
    expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toBeEnabled()
    expect(within(testPart()).queryByText('Test planned')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove the plan' })).not.toBeInTheDocument()

    const row = await db.thoughtRecords.get(id)

    expect(row).not.toHaveProperty('test')
    expect(row).toEqual({ ...before, test: undefined })
  })

  it('announces it politely, and moves focus to Plan a test', async () => {
    await openRecordScreen(id)
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    expect(await screen.findByText('Plan removed.')).toBeInTheDocument()
    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toHaveFocus()
    })
  })

  it('lets the user plan again after removing', async () => {
    await openRecordScreen(id)
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    await waitFor(() => {
      expect(within(testPart()).getByRole('button', { name: 'Plan a test' })).toBeEnabled()
    })
    fireEvent.click(within(testPart()).getByRole('button', { name: 'Plan a test' }))

    expect(screen.getByLabelText('How and when could you test this thought?')).toHaveValue('')
  })

  it('shows a calm message, keeps the plan and the question, and lets the user retry', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    vi.spyOn(db.thoughtRecords, 'update').mockRejectedValueOnce(new Error('storage unavailable'))
    await openRecordScreen(id)
    ask()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be removed/i)
    expect((await db.thoughtRecords.get(id))?.test).toEqual(planned)
    expect(screen.getByRole('button', { name: 'Yes, remove' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeEnabled()
    expect(report).toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    expect(await screen.findByText('Plan removed.')).toBeInTheDocument()
    expect(await db.thoughtRecords.get(id)).not.toHaveProperty('test')
  })

  it('says so when the record is deleted while the question is open, and recreates nothing', async () => {
    await openRecordScreen(id)
    ask()
    await db.thoughtRecords.delete(id)

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})
