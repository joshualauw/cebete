import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from '@/thoughts/errors'
import {
  addThoughtRecord,
  deleteThoughtRecord,
  listThoughtRecords,
  saveThoughtChallenge,
  updateThoughtRecord,
} from '@/thoughts/repository'
import type { ThoughtChallenge } from '@/thoughts/types'
import { newThought } from '@tests/helpers/thoughts'

const NOW = 10_000_000

const challenge: ThoughtChallenge = {
  evidenceFor: 'I stumbled once',
  evidenceAgainst: 'I prepared',
  balanced: 'I can recover',
  belief: 3,
  emotions: [{ emotion: 'anxious', intensity: 2 }],
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
  vi.spyOn(Date, 'now').mockReturnValue(NOW)
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function add(extra = {}): Promise<number> {
  return (await addThoughtRecord({ ...newThought(extra), createdAt: 1_000 })).id
}

describe('saveThoughtChallenge', () => {
  it('saves a first challenge and changes nothing else in the record', async () => {
    const id = await add({ situation: 'Team meeting', action: 'stayed quiet' })
    const before = await db.thoughtRecords.get(id)

    const saved = await saveThoughtChallenge(id, challenge)

    expect(saved).toEqual({ ...before, challenge })
    expect(await db.thoughtRecords.get(id)).toEqual({ ...before, challenge })
  })

  it('replaces the challenge on a revision', async () => {
    const id = await add()

    await saveThoughtChallenge(id, challenge)
    await saveThoughtChallenge(id, { ...challenge, balanced: 'revised', belief: 1 })

    expect((await db.thoughtRecords.get(id))?.challenge).toMatchObject({
      balanced: 'revised',
      belief: 1,
    })
  })

  it('does not store blank evidence, and keeps the text trimmed', async () => {
    const id = await add()

    await saveThoughtChallenge(id, {
      balanced: '  trimmed  ',
      belief: 2,
      evidenceFor: '   ',
      emotions: [{ emotion: 'anxious', intensity: 4 }],
    })

    const stored = (await db.thoughtRecords.get(id))?.challenge

    expect(stored?.balanced).toBe('trimmed')
    expect(stored && 'evidenceFor' in stored).toBe(false)
  })

  it('does not touch the other records', async () => {
    const first = await add()
    const second = await add({ thought: 'other' })
    const before = await db.thoughtRecords.get(second)

    await saveThoughtChallenge(first, challenge)

    expect(await db.thoughtRecords.get(second)).toEqual(before)
  })

  it.each<readonly [string, ThoughtChallenge]>([
    ['no balanced thought', { ...challenge, balanced: '' }],
    ['a too-long answer', { ...challenge, evidenceFor: 'x'.repeat(501) }],
    ['a belief out of range', { ...challenge, belief: 11 }],
    ['a rating out of range', { ...challenge, emotions: [{ emotion: 'anxious', intensity: 11 }] }],
    [
      'feelings that are not the record’s own',
      { ...challenge, emotions: [{ emotion: 'sad', intensity: 1 }] },
    ],
    [
      'more feelings than the record has',
      {
        ...challenge,
        emotions: [
          { emotion: 'anxious', intensity: 1 },
          { emotion: 'sad', intensity: 1 },
        ],
      },
    ],
  ])('refuses %s and changes nothing', async (_name, bad) => {
    const id = await add()
    const before = await db.thoughtRecords.get(id)

    await expect(saveThoughtChallenge(id, bad)).rejects.toBeInstanceOf(InvalidThoughtRecordError)
    expect(await db.thoughtRecords.get(id)).toEqual(before)
  })

  it('saves nothing and creates nothing when the record is gone', async () => {
    const id = await add()

    await deleteThoughtRecord(id)

    await expect(saveThoughtChallenge(id, challenge)).rejects.toBeInstanceOf(
      ThoughtRecordNotFoundError,
    )
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})

describe('editing a record that has a challenge', () => {
  const twoFeelings = newThought({
    emotions: [
      { emotion: 'anxious', intensity: 7 },
      { emotion: 'sad', intensity: 3 },
    ],
  })

  async function addChallenged(): Promise<number> {
    const saved = await addThoughtRecord({ ...twoFeelings, createdAt: 1_000 })

    await saveThoughtChallenge(saved.id, {
      balanced: 'balanced',
      belief: 2,
      emotions: [
        { emotion: 'anxious', intensity: 4 },
        { emotion: 'sad', intensity: 1 },
      ],
    })

    return saved.id
  }

  it('keeps the challenge when other parts of the record change', async () => {
    const id = await addChallenged()

    await updateThoughtRecord(id, { ...twoFeelings, thought: 'a new thought', createdAt: 1_000 })

    expect((await db.thoughtRecords.get(id))?.challenge).toEqual({
      balanced: 'balanced',
      belief: 2,
      emotions: [
        { emotion: 'anxious', intensity: 4 },
        { emotion: 'sad', intensity: 1 },
      ],
    })
  })

  it('keeps the rating of a feeling that remains and drops one that was removed', async () => {
    const id = await addChallenged()

    await updateThoughtRecord(id, {
      ...twoFeelings,
      emotions: [{ emotion: 'sad', intensity: 6 }],
      createdAt: 1_000,
    })

    expect((await db.thoughtRecords.get(id))?.challenge?.emotions).toEqual([
      { emotion: 'sad', intensity: 1 },
    ])
  })

  it('starts a new feeling at its rating in the record', async () => {
    const id = await addChallenged()

    await updateThoughtRecord(id, {
      ...twoFeelings,
      emotions: [...twoFeelings.emotions, { emotion: 'tired', intensity: 8 }],
      createdAt: 1_000,
    })

    expect((await db.thoughtRecords.get(id))?.challenge?.emotions).toEqual([
      { emotion: 'anxious', intensity: 4 },
      { emotion: 'sad', intensity: 1 },
      { emotion: 'tired', intensity: 8 },
    ])
  })

  it('leaves a record that was never challenged without a challenge', async () => {
    const id = await add()

    await updateThoughtRecord(id, { ...newThought({ thought: 'changed' }), createdAt: 1_000 })

    expect(await db.thoughtRecords.get(id)).not.toHaveProperty('challenge')
  })
})

describe('reading and deleting challenged records', () => {
  it('lists a record with its challenge', async () => {
    const id = await add()

    await saveThoughtChallenge(id, challenge)

    expect((await listThoughtRecords())[0]?.challenge).toEqual(challenge)
  })

  it('leaves out a record whose challenge is damaged, without deleting it', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const good = await add()

    await db.table('thoughtRecords').add({
      ...newThought(),
      createdAt: 5,
      challenge: { balanced: '', belief: 3, emotions: [{ emotion: 'anxious', intensity: 1 }] },
    })

    expect((await listThoughtRecords()).map((record) => record.id)).toEqual([good])
    expect(await db.thoughtRecords.count()).toBe(2)
  })

  it('removes the challenge together with the record', async () => {
    const id = await add()

    await saveThoughtChallenge(id, challenge)
    await deleteThoughtRecord(id)

    expect(await db.thoughtRecords.get(id)).toBeUndefined()
    expect(await db.thoughtRecords.count()).toBe(0)
  })
})
