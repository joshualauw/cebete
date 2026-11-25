import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import ThoughtRecordFlow from '@/thoughts/ThoughtRecordFlow'
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

describe('ThoughtRecordFlow: editing a record that no longer exists', () => {
  it('says so calmly, recreates nothing, and offers only a way to close', async () => {
    const onDone = vi.fn()

    renderWithProviders(<ThoughtRecordFlow record={missing} onDone={onDone} />)
    for (let step = 0; step < 5; step += 1) {
      fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
    }
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
