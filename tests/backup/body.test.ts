import { beforeEach, describe, expect, it } from 'vitest'

import { InvalidBackupError } from '@/backup/errors'
import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtBody } from '@/thoughts/repository'
import { backupText, currentTables } from '@tests/helpers/backup'
import { currentBody, currentThought, newThought } from '@tests/helpers/thoughts'

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

describe('backup: records with body notes', () => {
  it('round-trips a record with notes exactly, and a record without beside it', async () => {
    const noted = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    await addThoughtRecord({ ...newThought({ thought: 'plain' }), createdAt: 2_000 })
    await saveThoughtBody(noted.id, [{ area: 'chest', description: 'tight' }, { area: 'stomach' }])

    const original = await db.thoughtRecords.orderBy('id').toArray()
    const text = serializeBackup(await createBackup())

    await db.thoughtRecords.clear()
    await restoreBackup(parseBackup(text))

    expect(await db.thoughtRecords.orderBy('id').toArray()).toEqual(original)
  })

  it('counts a record with damaged notes as unreadable and leaves it out of the file', async () => {
    await addThoughtRecord(newThought())
    await db.table('thoughtRecords').add({
      ...newThought(),
      createdAt: 9,
      body: [{ area: 'elbow' }],
    })

    const { counts, skipped } = await createBackup()

    expect(counts.thoughtRecords).toBe(1)
    expect(skipped).toBe(1)
  })

  it.each<readonly [string, unknown]>([
    ['an area that is not in the list', [{ area: 'elbow' }]],
    ['the same area twice', [{ area: 'chest' }, { area: 'chest' }]],
    ['a description that is not text', [{ area: 'chest', description: 5 }]],
    ['notes that are not a list', 'chest'],
  ])('refuses a file whose notes have %s, as it would any other damaged row', (_name, body) => {
    const rows = [currentThought(1, { body })]

    expect(reason(backupText({ tables: currentTables([], rows) }))).toBe('damaged')
  })

  it('accepts valid notes in a file', () => {
    const rows = [currentThought(1, { body: currentBody() })]

    expect(reason(backupText({ tables: currentTables([], rows) }))).toBeUndefined()
  })

  it('still restores a backup made before body notes existed, with records and no notes', async () => {
    const older = parseBackup(
      backupText({ tables: currentTables([], [currentThought(1), currentThought(2)]) }),
    )

    await restoreBackup(older)

    const rows = await db.thoughtRecords.orderBy('id').toArray()

    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row).not.toHaveProperty('body')
    }
  })
})
