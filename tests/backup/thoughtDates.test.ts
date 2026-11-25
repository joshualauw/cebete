import { beforeEach, describe, expect, it } from 'vitest'

import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { db } from '@/db/db'
import {
  addThoughtRecord,
  listThoughtRecords,
  saveThoughtChallenge,
  saveThoughtTest,
} from '@/thoughts/repository'
import { backupText, currentEntry, currentTables } from '@tests/helpers/backup'
import {
  currentChallenge,
  currentDoneTest,
  currentThought,
  newThought,
  testedAtOf,
} from '@tests/helpers/thoughts'

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
})

describe('backup: the dates of a challenge and a test', () => {
  it('come back after a backup and restore, exactly as they were', async () => {
    const record = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    await saveThoughtChallenge(record.id, {
      balanced: 'I can recover',
      belief: 3,
      emotions: [{ emotion: 'anxious', intensity: 2 }],
    })
    await saveThoughtTest(record.id, {
      status: 'done',
      plan: 'Say hello',
      prediction: 'Nobody answers',
      result: 'They answered',
      belief: 2,
    })
    const original = await db.thoughtRecords.get(record.id)
    const text = serializeBackup(await createBackup())

    expect(original?.challenge?.challengedAt).toBeTypeOf('number')
    expect(testedAtOf(original?.test)).toBeTypeOf('number')

    await db.thoughtRecords.clear()
    await restoreBackup(parseBackup(text))

    expect(await db.thoughtRecords.get(record.id)).toEqual(original)
    expect((await listThoughtRecords())[0]?.challenge?.challengedAt).toBe(
      original?.challenge?.challengedAt,
    )
  })

  it('may be absent in an older backup, which restores with the records valid and undated', async () => {
    const text = backupText({
      tables: currentTables(
        [currentEntry(1)],
        [
          currentThought(1, { challenge: currentChallenge(), test: currentDoneTest() }),
          currentThought(2),
        ],
      ),
    })

    await restoreBackup(parseBackup(text))

    const records = await listThoughtRecords()

    expect(records).toHaveLength(2)
    expect(records.find((record) => record.id === 1)?.challenge).not.toHaveProperty('challengedAt')
    expect(testedAtOf(records.find((record) => record.id === 1)?.test)).toBeUndefined()
  })

  it.each([
    [
      'a challenge date that is not a moment',
      { challenge: currentChallenge({ challengedAt: 'x' }) },
    ],
    ['a test date that is not a moment', { test: currentDoneTest({ testedAt: 0 }) }],
  ])('refuses a file holding %s, and leaves the device as it was', async (_label, extra) => {
    await addThoughtRecord(newThought({ thought: 'safe' }))
    const before = await db.thoughtRecords.toArray()
    const text = backupText({ tables: currentTables([], [currentThought(1, extra)]) })

    expect(() => parseBackup(text)).toThrow()
    expect(await db.thoughtRecords.toArray()).toEqual(before)
  })

  it('accepts a file whose challenge and test carry real dates', () => {
    const text = backupText({
      tables: currentTables(
        [],
        [
          currentThought(1, {
            challenge: currentChallenge({ challengedAt: 1_800_000_000_000 }),
            test: currentDoneTest({ testedAt: 1_800_000_000_001 }),
          }),
        ],
      ),
    })

    expect(parseBackup(text).counts.thoughtRecords).toBe(1)
  })
})
