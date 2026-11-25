import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import LogResultFlow from '@/thoughts/LogResultFlow'
import type { ThoughtRecord, ThoughtTest } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'

const test: ThoughtTest = { status: 'planned', plan: 'a plan', prediction: 'a prediction' }

const missing: ThoughtRecord = {
  id: 42,
  emotions: [{ emotion: 'sad', intensity: 4 }],
  thought: 'already deleted elsewhere',
  belief: 6,
  createdAt: new Date(2020, 0, 1, 9, 0).getTime(),
  test,
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

describe('LogResultFlow: logging the result for a record that no longer exists', () => {
  it('says so calmly, recreates nothing, and offers only a way to close', async () => {
    const onDone = vi.fn()

    renderWithProviders(<LogResultFlow record={missing} test={test} onDone={onDone} />)
    fireEvent.change(screen.getByLabelText('What happened when you tested it?'), {
      target: { value: 'too late' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer exists/i)
    expect(await db.thoughtRecords.count()).toBe(0)
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    })
    expect(onDone).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onDone).toHaveBeenCalledOnce()
  })
})
