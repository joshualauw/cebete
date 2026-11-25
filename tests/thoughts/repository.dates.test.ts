import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import {
  addThoughtRecord,
  deleteThoughtRecord,
  saveThoughtChallenge,
  saveThoughtTest,
  updateThoughtRecord,
} from '@/thoughts/repository'
import type { ThoughtChallenge, ThoughtTest } from '@/thoughts/types'
import { currentDoneTest, currentThought, newThought, testedAtOf } from '@tests/helpers/thoughts'

const T1 = 10_000_000
const T2 = 20_000_000
const T3 = 30_000_000

const challenge: ThoughtChallenge = {
  balanced: 'I can recover',
  belief: 3,
  emotions: [{ emotion: 'anxious', intensity: 2 }],
}

const planned: ThoughtTest = {
  status: 'planned',
  plan: 'Say hello to two people',
  prediction: 'Nobody will answer',
}

const done: ThoughtTest = { ...planned, status: 'done', result: 'Both answered', belief: 3 }

let id = 0

function clock(at: number): void {
  vi.spyOn(Date, 'now').mockReturnValue(at)
}

async function stored(): Promise<{ challengedAt?: number; testedAt?: number }> {
  const row = await db.thoughtRecords.get(id)

  return { challengedAt: row?.challenge?.challengedAt, testedAt: testedAtOf(row?.test) }
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (await addThoughtRecord({ ...newThought(), createdAt: 1_000 })).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('dating a challenge', () => {
  it('stamps the moment it is saved', async () => {
    clock(T1)

    const saved = await saveThoughtChallenge(id, challenge)

    expect(saved.challenge?.challengedAt).toBe(T1)
    expect((await stored()).challengedAt).toBe(T1)
  })

  it('stamps a new moment on every revision, so the latest save wins', async () => {
    clock(T1)
    await saveThoughtChallenge(id, challenge)

    clock(T2)
    await saveThoughtChallenge(id, { ...challenge, balanced: 'revised' })

    expect((await stored()).challengedAt).toBe(T2)
  })

  it('stamps even a revision that changes nothing, since it is the latest save', async () => {
    clock(T1)
    await saveThoughtChallenge(id, challenge)

    clock(T2)
    await saveThoughtChallenge(id, challenge)

    expect((await stored()).challengedAt).toBe(T2)
  })

  it('is automatic: a date the caller supplies is ignored', async () => {
    clock(T1)

    await saveThoughtChallenge(id, { ...challenge, challengedAt: 5 })

    expect((await stored()).challengedAt).toBe(T1)
  })

  it('leaves the rest of the challenge as it was given', async () => {
    clock(T1)

    await saveThoughtChallenge(id, { ...challenge, evidenceFor: 'I stumbled once' })

    expect((await db.thoughtRecords.get(id))?.challenge).toEqual({
      ...challenge,
      evidenceFor: 'I stumbled once',
      challengedAt: T1,
    })
  })
})

describe('dating a test', () => {
  it('gives a planned test no date', async () => {
    clock(T1)

    const saved = await saveThoughtTest(id, planned)

    expect(saved.test).toEqual(planned)
    expect((await stored()).testedAt).toBeUndefined()
  })

  it('stamps the moment the result is first logged', async () => {
    clock(T1)
    await saveThoughtTest(id, planned)

    clock(T2)
    await saveThoughtTest(id, done)

    expect((await stored()).testedAt).toBe(T2)
  })

  it('stamps a new moment when the result is revised', async () => {
    clock(T1)
    await saveThoughtTest(id, done)

    clock(T2)
    await saveThoughtTest(id, { ...done, result: 'Only one answered' })

    expect((await stored()).testedAt).toBe(T2)
  })

  it('stamps a new moment when only the belief after the test is revised', async () => {
    clock(T1)
    await saveThoughtTest(id, done)

    clock(T2)
    await saveThoughtTest(id, { ...done, belief: 6 })

    expect((await stored()).testedAt).toBe(T2)
  })

  it('keeps the date of the result when only the plan is revised', async () => {
    clock(T1)
    await saveThoughtTest(id, done)

    clock(T3)
    await saveThoughtTest(id, { ...done, plan: 'Say hello to three people' })

    const row = await db.thoughtRecords.get(id)

    expect(testedAtOf(row?.test)).toBe(T1)
    expect(row?.test).toMatchObject({ plan: 'Say hello to three people' })
  })

  it('keeps the stored date when the plan is revised from a copy that carries another one', async () => {
    clock(T1)
    await saveThoughtTest(id, done)

    clock(T3)
    await saveThoughtTest(id, { ...done, testedAt: 5, plan: 'Another plan' })

    expect((await stored()).testedAt).toBe(T1)
  })

  it('is automatic: a date the caller supplies on a first result is ignored', async () => {
    clock(T1)

    await saveThoughtTest(id, { ...done, testedAt: 5 })

    expect((await stored()).testedAt).toBe(T1)
  })

  it('leaves an old, undated result undated when only its plan is revised', async () => {
    await db.table('thoughtRecords').update(id, { test: currentDoneTest() })

    clock(T2)
    await saveThoughtTest(id, {
      ...done,
      result: 'Both of them answered',
      belief: 3,
      plan: 'A revised plan',
    })

    expect((await stored()).testedAt).toBeUndefined()
  })

  it('dates an old, undated result once its result is revised', async () => {
    await db.table('thoughtRecords').update(id, { test: currentDoneTest() })

    clock(T2)
    await saveThoughtTest(id, { ...done, result: 'Something new' })

    expect((await stored()).testedAt).toBe(T2)
  })

  it('drops the date when a logged test is replaced by a plan', async () => {
    clock(T1)
    await saveThoughtTest(id, done)

    await saveThoughtTest(id, planned)

    expect((await stored()).testedAt).toBeUndefined()
  })
})

describe('the dates and the rest of the record', () => {
  it('both survive editing the thought, also when the challenge feelings follow the edit', async () => {
    clock(T1)
    await saveThoughtChallenge(id, challenge)
    await saveThoughtTest(id, done)

    clock(T3)
    await updateThoughtRecord(id, {
      ...newThought({
        thought: 'A different thought',
        emotions: [
          { emotion: 'anxious', intensity: 6 },
          { emotion: 'sad', intensity: 4 },
        ],
      }),
      createdAt: 2_000,
    })

    expect(await stored()).toEqual({ challengedAt: T1, testedAt: T1 })
    expect((await db.thoughtRecords.get(id))?.challenge?.emotions).toHaveLength(2)
  })

  it('a challenge does not date the test, nor a test the challenge', async () => {
    clock(T1)
    await saveThoughtChallenge(id, challenge)

    clock(T2)
    await saveThoughtTest(id, done)

    expect(await stored()).toEqual({ challengedAt: T1, testedAt: T2 })
  })

  it('go with the record when it is deleted', async () => {
    await saveThoughtChallenge(id, challenge)
    await saveThoughtTest(id, done)

    await deleteThoughtRecord(id)

    expect(await db.thoughtRecords.toArray()).toEqual([])
  })

  it('leave an old record that was never dated exactly as it was', async () => {
    await db
      .table('thoughtRecords')
      .put({ ...currentThought(77), challenge: { ...challenge }, test: currentDoneTest() })

    const row = await db.thoughtRecords.get(77)

    expect(row?.challenge).not.toHaveProperty('challengedAt')
    expect(testedAtOf(row?.test)).toBeUndefined()
  })
})
