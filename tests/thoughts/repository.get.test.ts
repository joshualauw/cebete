import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addThoughtRecord, getThoughtRecord } from '@/thoughts/repository'
import { currentChallenge, newThought } from '@tests/helpers/thoughts'

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getThoughtRecord', () => {
  it('returns the record with that id', async () => {
    const saved = await addThoughtRecord(newThought({ thought: 'I will fail' }))

    expect(await getThoughtRecord(saved.id)).toEqual(saved)
  })

  it('returns a record with its challenge', async () => {
    const saved = await addThoughtRecord(newThought())
    await db.table('thoughtRecords').update(saved.id, { challenge: currentChallenge() })

    expect((await getThoughtRecord(saved.id))?.challenge?.balanced).toBe(
      'I may stumble, but I can recover',
    )
  })

  it('returns undefined when there is no record with that id', async () => {
    expect(await getThoughtRecord(404)).toBeUndefined()
  })

  it('treats an unreadable row as missing, leaves it in place, and reports it once', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const id: unknown = await db.table('thoughtRecords').add({ createdAt: 1, thought: 'damaged' })

    expect(typeof id).toBe('number')

    if (typeof id !== 'number') {
      return
    }

    expect(await getThoughtRecord(id)).toBeUndefined()
    expect(await getThoughtRecord(id)).toBeUndefined()

    expect(warn).toHaveBeenCalledTimes(1)
    expect(await db.table('thoughtRecords').get(id)).toBeDefined()
  })
})
