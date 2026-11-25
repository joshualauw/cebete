import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import type { BodyNote } from '@/thoughts/body'
import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from '@/thoughts/errors'
import {
  addThoughtRecord,
  deleteThoughtRecord,
  listThoughtRecords,
  saveThoughtBody,
  saveThoughtChallenge,
  saveThoughtTest,
  updateThoughtRecord,
} from '@/thoughts/repository'
import { newThought } from '@tests/helpers/thoughts'

const notes: readonly BodyNote[] = [{ area: 'chest', description: 'tight' }, { area: 'stomach' }]

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('saveThoughtBody', () => {
  it('saves notes on the same record and changes nothing else in it', async () => {
    const saved = await addThoughtRecord({
      ...newThought({ situation: 'Meeting' }),
      createdAt: 1_000,
    })
    const before = await db.thoughtRecords.get(saved.id)

    await saveThoughtBody(saved.id, notes)

    expect(await db.thoughtRecords.get(saved.id)).toEqual({ ...before, body: notes })
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('stores a clean copy, in the order of the body areas', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtBody(saved.id, [
      { area: 'legs', description: '  heavy  ' },
      { area: 'head', description: '   ' },
    ])

    expect((await db.thoughtRecords.get(saved.id))?.body).toEqual([
      { area: 'head' },
      { area: 'legs', description: 'heavy' },
    ])
  })

  it('replaces the notes it already has', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtBody(saved.id, notes)
    await saveThoughtBody(saved.id, [{ area: 'hands', description: 'cold' }])

    expect((await db.thoughtRecords.get(saved.id))?.body).toEqual([
      { area: 'hands', description: 'cold' },
    ])
  })

  it('removes the notes when the list is empty, so the record has no body property at all', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })
    const before = await db.thoughtRecords.get(saved.id)

    await saveThoughtBody(saved.id, notes)
    await saveThoughtBody(saved.id, [])

    const row = await db.thoughtRecords.get(saved.id)

    expect(row).not.toHaveProperty('body')
    expect(row).toEqual(before)
  })

  it('does nothing to a record that has no notes when told there are none', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })
    const before = await db.thoughtRecords.get(saved.id)

    await saveThoughtBody(saved.id, [])

    expect(await db.thoughtRecords.get(saved.id)).toEqual(before)
  })

  it('keeps the challenge and the test the record already has', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtChallenge(saved.id, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
    await saveThoughtTest(saved.id, { status: 'planned', plan: 'a plan', prediction: 'a guess' })
    await saveThoughtBody(saved.id, notes)

    const row = await db.thoughtRecords.get(saved.id)

    expect(row?.challenge?.balanced).toBe('I can cope')
    expect(row?.test?.plan).toBe('a plan')
    expect(row?.body).toEqual(notes)
  })

  it('saves nothing when a rule is broken, and keeps the old notes', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtBody(saved.id, notes)

    await expect(
      saveThoughtBody(saved.id, [{ area: 'chest' }, { area: 'chest' }]),
    ).rejects.toBeInstanceOf(InvalidThoughtRecordError)
    expect((await db.thoughtRecords.get(saved.id))?.body).toEqual(notes)
  })

  it('never recreates a record that is gone', async () => {
    const saved = await addThoughtRecord(newThought())

    await deleteThoughtRecord(saved.id)

    await expect(saveThoughtBody(saved.id, notes)).rejects.toBeInstanceOf(
      ThoughtRecordNotFoundError,
    )
    await expect(saveThoughtBody(saved.id, [])).rejects.toBeInstanceOf(ThoughtRecordNotFoundError)
    expect(await db.thoughtRecords.count()).toBe(0)
  })

  it('goes with the record when it is deleted', async () => {
    const saved = await addThoughtRecord(newThought())

    await saveThoughtBody(saved.id, notes)
    await deleteThoughtRecord(saved.id)

    expect(await db.thoughtRecords.toArray()).toEqual([])
  })
})

describe('updateThoughtRecord and the body notes', () => {
  it('keeps the notes of a record that is edited', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    await saveThoughtBody(saved.id, notes)
    await updateThoughtRecord(saved.id, {
      ...newThought({ thought: 'A different thought' }),
      createdAt: 2_000,
    })

    const row = await db.thoughtRecords.get(saved.id)

    expect(row?.thought).toBe('A different thought')
    expect(row?.body).toEqual(notes)
  })

  it('does not add notes to a record that has none', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    await updateThoughtRecord(saved.id, { ...newThought(), createdAt: 1_000 })

    expect(await db.thoughtRecords.get(saved.id)).not.toHaveProperty('body')
  })
})

describe('listThoughtRecords and damaged notes', () => {
  it('leaves a record with damaged notes out, never deletes it, and reports it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

    await addThoughtRecord({ ...newThought({ thought: 'fine' }), createdAt: 1_000 })
    await db.table('thoughtRecords').add({
      ...newThought({ thought: 'damaged' }),
      createdAt: 2_000,
      body: [{ area: 'elbow' }],
    })

    const listed = await listThoughtRecords()

    expect(listed.map((record) => record.thought)).toEqual(['fine'])
    expect(await db.thoughtRecords.count()).toBe(2)
    expect(warn).toHaveBeenCalled()
  })
})
