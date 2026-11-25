import { beforeEach, describe, expect, it } from 'vitest'

import { InvalidBackupError } from '@/backup/errors'
import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtTest } from '@/thoughts/repository'
import { backupText, currentTables } from '@tests/helpers/backup'
import {
  currentDoneTest,
  currentPlannedTest,
  currentThought,
  newThought,
} from '@tests/helpers/thoughts'

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
})

function reason(text: string): string | undefined {
  try {
    parseBackup(text)
  } catch (error) {
    if (error instanceof InvalidBackupError) {
      return error.reason
    }
    throw error
  }

  return undefined
}

describe('backup: records with a test', () => {
  it('round-trips a planned test, a done test and a record without one, exactly', async () => {
    const planned = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })
    const done = await addThoughtRecord({ ...newThought({ thought: 'second' }), createdAt: 2_000 })

    await addThoughtRecord({ ...newThought({ thought: 'plain' }), createdAt: 3_000 })
    await saveThoughtTest(planned.id, {
      status: 'planned',
      plan: 'Say hello to two people',
      prediction: 'Nobody will answer',
    })
    await saveThoughtTest(done.id, {
      status: 'done',
      plan: 'Say hello to two people',
      prediction: 'Nobody will answer',
      result: 'Both answered',
      belief: 3,
    })

    const original = await db.thoughtRecords.orderBy('id').toArray()
    const text = serializeBackup(await createBackup())

    await db.thoughtRecords.clear()
    await restoreBackup(parseBackup(text))

    expect(await db.thoughtRecords.orderBy('id').toArray()).toEqual(original)
  })

  it('counts a record with a damaged test as unreadable and leaves it out of the file', async () => {
    await addThoughtRecord(newThought())
    await db.table('thoughtRecords').add({
      ...newThought(),
      createdAt: 9,
      test: { status: 'done', plan: 'x', prediction: 'y', result: '', belief: 3 },
    })

    const { counts, skipped } = await createBackup()

    expect(counts.thoughtRecords).toBe(1)
    expect(skipped).toBe(1)
  })

  it.each<readonly [string, object]>([
    ['a plan that is blank', currentPlannedTest({ plan: '' })],
    ['a prediction that is missing', currentPlannedTest({ prediction: undefined })],
    ['a done test with no result', currentDoneTest({ result: '' })],
    ['a done test with a belief out of range', currentDoneTest({ belief: 12 })],
    ['a test with an unknown status', currentPlannedTest({ status: 'started' })],
  ])('refuses a file whose test has %s, as it would any other damaged row', (_name, test) => {
    const rows = [currentThought(1, { test })]

    expect(reason(backupText({ tables: currentTables([], rows) }))).toBe('damaged')
  })

  it('accepts a planned test and a done test in a file', () => {
    const rows = [
      currentThought(1, { test: currentPlannedTest() }),
      currentThought(2, { test: currentDoneTest() }),
    ]

    expect(reason(backupText({ tables: currentTables([], rows) }))).toBeUndefined()
  })

  it('still restores a backup made before tests existed, with records and no tests', async () => {
    const older = parseBackup(
      backupText({ tables: currentTables([], [currentThought(1), currentThought(2)]) }),
    )

    await restoreBackup(older)

    const rows = await db.thoughtRecords.orderBy('id').toArray()

    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row).not.toHaveProperty('test')
    }
  })
})
