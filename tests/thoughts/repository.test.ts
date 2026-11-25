import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from '@/thoughts/errors'
import {
  addThoughtRecord,
  deleteThoughtRecord,
  listThoughtRecords,
  updateThoughtRecord,
} from '@/thoughts/repository'
import type { NewThoughtRecord, ThoughtRecordChanges } from '@/thoughts/types'

const NOW = 10_000_000

const base: NewThoughtRecord = {
  emotions: [{ emotion: 'anxious', intensity: 7 }],
  thought: 'I will fail',
  belief: 8,
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
  vi.spyOn(Date, 'now').mockReturnValue(NOW)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addThoughtRecord', () => {
  it('saves a record with all its parts and returns it as stored', async () => {
    const full: NewThoughtRecord = {
      ...base,
      situation: 'Team meeting',
      action: 'stayed quiet',
      emotions: [
        { emotion: 'anxious', intensity: 7 },
        { emotion: 'sad', intensity: 3 },
      ],
    }

    const saved = await addThoughtRecord(full)

    expect(saved).toEqual({ ...full, id: saved.id, createdAt: NOW })
    expect(await db.thoughtRecords.toArray()).toEqual([saved])
  })

  it('stamps the moment of saving when no time is given, and keeps a given time exactly', async () => {
    const stamped = await addThoughtRecord(base)
    const chosen = await addThoughtRecord({ ...base, createdAt: 1_234_567 })

    expect(stamped.createdAt).toBe(NOW)
    expect(chosen.createdAt).toBe(1_234_567)
  })

  it('does not store blank optional answers', async () => {
    await addThoughtRecord({ ...base, situation: '  ', action: '' })

    const [stored] = await db.thoughtRecords.toArray()

    expect(stored).toBeDefined()
    expect(stored && 'situation' in stored).toBe(false)
    expect(stored && 'action' in stored).toBe(false)
  })

  it.each<readonly [string, NewThoughtRecord & { createdAt?: number }]>([
    ['no feelings', { ...base, emotions: [] }],
    ['a blank thought', { ...base, thought: ' ' }],
    ['a belief out of range', { ...base, belief: 11 }],
    ['a too-long answer', { ...base, situation: 'x'.repeat(501) }],
    ['a future time', { ...base, createdAt: NOW + 1 }],
    ['an invalid time', { ...base, createdAt: Number.NaN }],
  ])('refuses %s and saves nothing', async (_name, input) => {
    await expect(addThoughtRecord(input)).rejects.toBeInstanceOf(InvalidThoughtRecordError)
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})

describe('updateThoughtRecord', () => {
  async function addAt(time: number, record: NewThoughtRecord = base): Promise<number> {
    return (await addThoughtRecord({ ...record, createdAt: time })).id
  }

  it('changes every part, keeps the id, and returns the stored record', async () => {
    const id = await addAt(1_000, { ...base, situation: 'old', action: 'old' })
    const changes: ThoughtRecordChanges = {
      situation: 'new situation',
      emotions: [{ emotion: 'sad', intensity: 2 }],
      action: 'new action',
      thought: 'a new thought',
      belief: 3,
      createdAt: 5_000,
    }

    const updated = await updateThoughtRecord(id, changes)

    expect(updated).toEqual({ ...changes, id })
    expect(await db.thoughtRecords.toArray()).toEqual([updated])
  })

  it('removes an answer that was cleared and keeps an untouched time to the millisecond', async () => {
    const id = await addAt(1_234_567, { ...base, situation: 'remove me', action: 'and me' })

    await updateThoughtRecord(id, { ...base, situation: ' ', createdAt: 1_234_567 })

    const stored = await db.thoughtRecords.get(id)

    expect(stored).toBeDefined()
    expect(stored && 'situation' in stored).toBe(false)
    expect(stored && 'action' in stored).toBe(false)
    expect(stored?.createdAt).toBe(1_234_567)
  })

  it('does not touch other records', async () => {
    const first = await addAt(1_000)
    const second = await addAt(2_000, { ...base, thought: 'other' })
    const before = await db.thoughtRecords.get(second)

    await updateThoughtRecord(first, { ...base, thought: 'changed', createdAt: 1_000 })

    expect(await db.thoughtRecords.get(second)).toEqual(before)
    expect(await db.thoughtRecords.count()).toBe(2)
  })

  it.each<readonly [string, ThoughtRecordChanges]>([
    ['no feelings', { ...base, emotions: [], createdAt: 1_000 }],
    ['a blank thought', { ...base, thought: '', createdAt: 1_000 }],
    ['a belief out of range', { ...base, belief: -1, createdAt: 1_000 }],
    ['a future time', { ...base, createdAt: NOW + 1 }],
  ])('refuses %s and changes nothing', async (_name, changes) => {
    const id = await addAt(1_000)
    const before = await db.thoughtRecords.toArray()

    await expect(updateThoughtRecord(id, changes)).rejects.toBeInstanceOf(InvalidThoughtRecordError)
    expect(await db.thoughtRecords.toArray()).toEqual(before)
  })

  it('saves nothing and creates nothing when the record is gone', async () => {
    const id = await addAt(1_000)

    await deleteThoughtRecord(id)

    await expect(updateThoughtRecord(id, { ...base, createdAt: 1_000 })).rejects.toBeInstanceOf(
      ThoughtRecordNotFoundError,
    )
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})

describe('listThoughtRecords', () => {
  it('lists newest first, and keeps save order for records of the same time', async () => {
    const oldest = await addThoughtRecord({ ...base, createdAt: 1_000 })
    const newest = await addThoughtRecord({ ...base, createdAt: 3_000 })
    const tieFirst = await addThoughtRecord({ ...base, createdAt: 2_000 })
    const tieSecond = await addThoughtRecord({ ...base, createdAt: 2_000 })

    expect((await listThoughtRecords()).map((record) => record.id)).toEqual([
      newest.id,
      tieSecond.id,
      tieFirst.id,
      oldest.id,
    ])
  })

  it('is empty when nothing is stored', async () => {
    expect(await listThoughtRecords()).toEqual([])
  })

  it('leaves out a damaged row without deleting it', async () => {
    const good = await addThoughtRecord(base)

    await db.table('thoughtRecords').add({ createdAt: 5, thought: 'no feelings here' })
    await db.table('thoughtRecords').add({ createdAt: 6, emotions: [], thought: 'x', belief: 1 })

    expect((await listThoughtRecords()).map((record) => record.id)).toEqual([good.id])
    expect(await db.thoughtRecords.count()).toBe(3)
  })
})

describe('deleteThoughtRecord', () => {
  it('removes one record and leaves the others', async () => {
    const first = await addThoughtRecord(base)
    const second = await addThoughtRecord({ ...base, thought: 'keep me' })

    await deleteThoughtRecord(first.id)

    expect((await listThoughtRecords()).map((record) => record.id)).toEqual([second.id])
  })

  it('does nothing when the record is already gone', async () => {
    await expect(deleteThoughtRecord(9_999)).resolves.toBeUndefined()
  })
})
