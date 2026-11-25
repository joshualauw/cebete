import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import PlanTestFlow from '@/thoughts/PlanTestFlow'
import type { ThoughtRecord } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'

const missing: ThoughtRecord = {
  id: 42,
  emotions: [{ emotion: 'sad', intensity: 4 }],
  thought: 'already deleted elsewhere',
  belief: 6,
  createdAt: new Date(2020, 0, 1, 9, 0).getTime(),
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

describe('PlanTestFlow: planning a test of a record that no longer exists', () => {
  it('says so calmly, recreates nothing, and offers only a way to close', async () => {
    const onDone = vi.fn()

    renderWithProviders(<PlanTestFlow record={missing} onDone={onDone} />)
    fireEvent.change(screen.getByLabelText('How and when could you test this thought?'), {
      target: { value: 'too late' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.change(
      screen.getByLabelText('If the thought were true, what do you predict would happen?'),
      { target: { value: 'nothing' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer exists/i)
    expect(await db.thoughtRecords.count()).toBe(0)
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    })
    expect(onDone).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onDone).toHaveBeenCalledOnce()
  })
})
