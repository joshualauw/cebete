import { beforeEach, describe, expect, it } from 'vitest'

import { InvalidBackupError } from '@/backup/errors'
import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import { backupText, currentTables } from '@tests/helpers/backup'
import { currentChallenge, currentThought, newThought } from '@tests/helpers/thoughts'

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

describe('backup: challenged thought records', () => {
  it('round-trips a challenged record exactly, and an unchallenged one beside it', async () => {
    const challenged = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    await addThoughtRecord({ ...newThought({ thought: 'plain' }), createdAt: 2_000 })
    await saveThoughtChallenge(challenged.id, {
      evidenceAgainst: 'I prepared',
      balanced: 'I can recover',
      belief: 3,
      emotions: [{ emotion: 'anxious', intensity: 2 }],
    })
    const original = await db.thoughtRecords.orderBy('id').toArray()
    const text = serializeBackup(await createBackup())

    await db.thoughtRecords.clear()
    await restoreBackup(parseBackup(text))

    expect(await db.thoughtRecords.orderBy('id').toArray()).toEqual(original)
  })

  it('counts a record with a damaged challenge as unreadable and leaves it out of the file', async () => {
    await addThoughtRecord(newThought())
    await db.table('thoughtRecords').add({
      ...newThought(),
      createdAt: 9,
      challenge: { balanced: '', belief: 3, emotions: [{ emotion: 'anxious', intensity: 1 }] },
    })

    const { counts, skipped } = await createBackup()

    expect(counts.thoughtRecords).toBe(1)
    expect(skipped).toBe(1)
  })

  it('refuses a file whose challenge is damaged, as it would any other damaged row', () => {
    const rows = [currentThought(1, { challenge: currentChallenge({ balanced: '' }) })]

    expect(reason(backupText({ tables: currentTables([], rows) }))).toBe('damaged')
  })

  it('refuses a file whose challenge rates feelings the record does not have', () => {
    const rows = [
      currentThought(1, {
        challenge: currentChallenge({ emotions: [{ emotion: 'sad', intensity: 1 }] }),
      }),
    ]

    expect(reason(backupText({ tables: currentTables([], rows) }))).toBe('damaged')
  })

  it('still restores a backup made before challenges existed, with records and no challenges', async () => {
    const older = parseBackup(
      backupText({ tables: currentTables([], [currentThought(1), currentThought(2)]) }),
    )

    await restoreBackup(older)

    const rows = await db.thoughtRecords.orderBy('id').toArray()

    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(row).not.toHaveProperty('challenge')
    }
  })

  it('accepts a valid challenge in a file', () => {
    const rows = [currentThought(1, { challenge: currentChallenge() })]

    expect(reason(backupText({ tables: currentTables([], rows) }))).toBeUndefined()
  })
})
