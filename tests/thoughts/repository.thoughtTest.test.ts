import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from '@/thoughts/errors'
import {
  addThoughtRecord,
  deleteThoughtRecord,
  listThoughtRecords,
  removeThoughtPlan,
  saveThoughtChallenge,
  saveThoughtTest,
  updateThoughtRecord,
} from '@/thoughts/repository'
import type { ThoughtTest } from '@/thoughts/types'
import { isThoughtRecord } from '@/thoughts/validation'
import { newThought } from '@tests/helpers/thoughts'

const planned: ThoughtTest = {
  status: 'planned',
  plan: 'Say hello to two people on Monday',
  prediction: 'Nobody will answer',
}

const done: ThoughtTest = { ...planned, status: 'done', result: 'Both answered', belief: 3 }

const NOW = 10_000_000

/** A logged test as stored: the result carries the moment it was logged. */
const datedDone: ThoughtTest = { ...done, testedAt: NOW }

beforeEach(async () => {
  await db.thoughtRecords.clear()
  vi.spyOn(Date, 'now').mockReturnValue(NOW)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('saveThoughtTest', () => {
  it('saves a first plan on the same record and changes nothing else in it', async () => {
    const saved = await addThoughtRecord({
      ...newThought({ situation: 'Meeting' }),
      createdAt: 1_000,
    })
    const before = await db.thoughtRecords.get(saved.id)

    const updated = await saveThoughtTest(saved.id, planned)

    expect(updated.test).toEqual(planned)
    expect(await db.thoughtRecords.get(saved.id)).toEqual({ ...before, test: planned })
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('saves the result over the plan, and a revision over the result', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtTest(saved.id, planned)
    await saveThoughtTest(saved.id, done)

    expect((await db.thoughtRecords.get(saved.id))?.test).toEqual(datedDone)

    await saveThoughtTest(saved.id, { ...done, result: 'Only one answered', belief: 5 })

    expect((await db.thoughtRecords.get(saved.id))?.test).toEqual({
      ...datedDone,
      result: 'Only one answered',
      belief: 5,
    })
  })

  it('stores a clean, trimmed copy', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtTest(saved.id, { ...planned, plan: '  trimmed  ' })

    expect((await db.thoughtRecords.get(saved.id))?.test).toMatchObject({ plan: 'trimmed' })
  })

  it('keeps the challenge the record already has', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtChallenge(saved.id, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
    await saveThoughtTest(saved.id, planned)

    const row = await db.thoughtRecords.get(saved.id)

    expect(row?.challenge?.balanced).toBe('I can cope')
    expect(row?.test).toEqual(planned)
  })

  it('saves nothing when a rule is broken, and keeps the old test', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtTest(saved.id, planned)

    await expect(saveThoughtTest(saved.id, { ...planned, plan: '   ' })).rejects.toBeInstanceOf(
      InvalidThoughtRecordError,
    )
    expect((await db.thoughtRecords.get(saved.id))?.test).toEqual(planned)
  })

  it('never recreates a record that is gone', async () => {
    const saved = await addThoughtRecord(newThought())

    await deleteThoughtRecord(saved.id)

    await expect(saveThoughtTest(saved.id, planned)).rejects.toBeInstanceOf(
      ThoughtRecordNotFoundError,
    )
    expect(await db.thoughtRecords.count()).toBe(0)
  })

  it('goes with the record when it is deleted', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtTest(saved.id, done)
    await deleteThoughtRecord(saved.id)

    expect(await db.thoughtRecords.toArray()).toEqual([])
  })
})

describe('updateThoughtRecord and the test', () => {
  it('keeps the test of a record that is edited', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    await saveThoughtTest(saved.id, done)
    await updateThoughtRecord(saved.id, {
      ...newThought({ thought: 'A different thought' }),
      createdAt: 2_000,
    })

    const row = await db.thoughtRecords.get(saved.id)

    expect(row?.thought).toBe('A different thought')
    expect(row?.test).toEqual(datedDone)
  })

  it('does not add a test to a record that has none', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    await updateThoughtRecord(saved.id, { ...newThought(), createdAt: 1_000 })

    expect(await db.thoughtRecords.get(saved.id)).not.toHaveProperty('test')
  })
})

describe('removeThoughtPlan', () => {
  it('removes a planned test, so the record has no test property at all', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })
    const before = await db.thoughtRecords.get(saved.id)

    await saveThoughtTest(saved.id, planned)
    await removeThoughtPlan(saved.id)

    const row = await db.thoughtRecords.get(saved.id)

    expect(row).not.toHaveProperty('test')
    expect(row).toEqual(before)
    expect(isThoughtRecord(row)).toBe(true)
  })

  it('keeps the challenge and everything else in the record', async () => {
    const saved = await addThoughtRecord({
      ...newThought({ situation: 'Meeting' }),
      createdAt: 1_000,
    })

    await saveThoughtChallenge(saved.id, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
    await saveThoughtTest(saved.id, planned)

    const before = await db.thoughtRecords.get(saved.id)

    await removeThoughtPlan(saved.id)

    const row = await db.thoughtRecords.get(saved.id)

    expect(row?.challenge?.balanced).toBe('I can cope')
    expect(row).toEqual({ ...before, test: undefined })
    expect(row).not.toHaveProperty('test')
  })

  it('refuses to remove a test whose result is logged, and keeps it', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtTest(saved.id, done)

    await expect(removeThoughtPlan(saved.id)).rejects.toBeInstanceOf(InvalidThoughtRecordError)
    expect((await db.thoughtRecords.get(saved.id))?.test).toEqual(datedDone)
  })

  it('does nothing to a record that has no test', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })
    const before = await db.thoughtRecords.get(saved.id)

    await removeThoughtPlan(saved.id)

    expect(await db.thoughtRecords.get(saved.id)).toEqual(before)
  })

  it('never recreates a record that is gone', async () => {
    const saved = await addThoughtRecord(newThought())

    await deleteThoughtRecord(saved.id)

    await expect(removeThoughtPlan(saved.id)).rejects.toBeInstanceOf(ThoughtRecordNotFoundError)
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})

describe('listThoughtRecords and a damaged test', () => {
  it('leaves a record with a damaged test out, never deletes it, and reports it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await addThoughtRecord({ ...newThought({ thought: 'fine' }), createdAt: 1_000 })
    await db.table('thoughtRecords').add({
      ...newThought({ thought: 'damaged' }),
      createdAt: 2_000,
      test: { status: 'done', plan: 'x', prediction: 'y', result: '', belief: 3 },
    })

    const listed = await listThoughtRecords()

    expect(listed.map((record) => record.thought)).toEqual(['fine'])
    expect(await db.thoughtRecords.count()).toBe(2)
    expect(warn).toHaveBeenCalled()
  })
})
