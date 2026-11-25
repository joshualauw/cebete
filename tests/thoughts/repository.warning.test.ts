import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { listThoughtRecords } from '@/thoughts/repository'

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listThoughtRecords: unreadable rows', () => {
  it('reports unreadable rows once, not on every refresh, and uses the singular for one', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await db.table('thoughtRecords').add({ createdAt: 1, thought: 'damaged' })
    await listThoughtRecords()
    await listThoughtRecords()

    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledWith('1 saved thought record could not be read and is not shown')

    await db.table('thoughtRecords').add({ createdAt: 2, thought: 'damaged too' })
    await listThoughtRecords()

    expect(warn).toHaveBeenLastCalledWith(
      '2 saved thought records could not be read and are not shown',
    )
  })
})
