import { beforeEach, describe, expect, it } from 'vitest'

import { InvalidBackupError } from '@/backup/errors'
import { describeCounts, describeExport, describeRestore } from '@/backup/describe'
import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import { addThoughtRecord } from '@/thoughts/repository'
import { backupText, currentEntry, currentTables } from '@tests/helpers/backup'
import { oneEmotion } from '@tests/helpers/mood'
import { currentThought, newThought } from '@tests/helpers/thoughts'

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
})

function refusal(text: string): string | undefined {
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

describe('backup: thought records', () => {
  it('puts every thought record in the file, with its id, parts and time', async () => {
    await addThoughtRecord(newThought({ situation: 'Team meeting', action: 'stayed quiet' }))
    await addThoughtRecord({ ...newThought({ thought: 'again' }), createdAt: 1_234_567 })
    const stored = await db.thoughtRecords.orderBy('id').toArray()

    const { file, counts, skipped } = await createBackup()

    expect(file.tables.thoughtRecords).toEqual(stored)
    expect(counts.thoughtRecords).toBe(2)
    expect(skipped).toBe(0)
  })

  it('leaves out a thought record it cannot read, and counts it', async () => {
    await addThoughtRecord(newThought())
    await db.table('thoughtRecords').add({ createdAt: 10, thought: 'no feelings or belief' })

    const { counts, skipped } = await createBackup()

    expect(counts.thoughtRecords).toBe(1)
    expect(skipped).toBe(1)
  })

  it('round-trips: export, wipe, restore gives back the same records, ids and times', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    await addThoughtRecord({ ...newThought({ situation: 'a' }), createdAt: 1_111_111 })
    await addThoughtRecord({ ...newThought({ thought: 'b', belief: 2 }), createdAt: 2_222_222 })
    const thoughts = await db.thoughtRecords.orderBy('id').toArray()
    const moods = await db.moodEntries.orderBy('id').toArray()
    const text = serializeBackup(await createBackup())

    await db.moodEntries.clear()
    await db.thoughtRecords.clear()
    await restoreBackup(parseBackup(text))

    expect(await db.thoughtRecords.orderBy('id').toArray()).toEqual(thoughts)
    expect(await db.moodEntries.orderBy('id').toArray()).toEqual(moods)
  })

  it('restores a backup made before thought records existed, leaving none on the device', async () => {
    await addThoughtRecord(newThought())
    const older = parseBackup(
      backupText({
        version: 3,
        tables: { moodEntries: [currentEntry(1), currentEntry(2, 'sad', 7)] },
      }),
    )

    await restoreBackup(older)

    expect(older.counts).toEqual({ moodEntries: 2, thoughtRecords: 0, copingItems: 0 })
    expect(await db.thoughtRecords.count()).toBe(0)
    expect(await db.moodEntries.count()).toBe(2)
  })

  it('refuses a file whose thought records are damaged, and changes nothing', async () => {
    const kept = await addThoughtRecord(newThought())
    const text = backupText({
      tables: currentTables([], [currentThought(1), { id: 2, thought: 'no feelings' }]),
    })

    expect(refusal(text)).toBe('damaged')
    expect(await db.thoughtRecords.toArray()).toEqual([kept])
  })

  it('refuses a file with repeated thought record ids', () => {
    const text = backupText({ tables: currentTables([], [currentThought(1), currentThought(1)]) })

    expect(refusal(text)).toBe('damaged')
  })

  it('refuses a current-version file that holds no thought records table at all', () => {
    expect(refusal(backupText({ tables: { moodEntries: [] } }))).toBe('damaged')
  })

  it('still refuses a file made by a newer version', () => {
    expect(refusal(backupText({ version: 99 }))).toBe('newer-version')
  })
})

describe('backup messages: thought records', () => {
  it('names both kinds of rows, with the right singular and plural', () => {
    expect(describeCounts({ moodEntries: 3, thoughtRecords: 2 })).toBe(
      '3 mood entries and 2 thought records',
    )
    expect(describeCounts({ moodEntries: 1, thoughtRecords: 1 })).toBe(
      '1 mood entry and 1 thought record',
    )
  })

  it('says nothing about a kind that has no rows', () => {
    expect(describeCounts({ moodEntries: 0, thoughtRecords: 4 })).toBe('4 thought records')
    expect(describeCounts({ moodEntries: 2, thoughtRecords: 0 })).toBe('2 mood entries')
    expect(describeCounts({ moodEntries: 0, thoughtRecords: 0 })).toBe('')
  })

  it('uses them in the export and restore messages', () => {
    expect(describeExport({ moodEntries: 3, thoughtRecords: 2 }, 0)).toBe(
      'Backup saved with 3 mood entries and 2 thought records.',
    )
    expect(describeRestore({ moodEntries: 0, thoughtRecords: 2 })).toBe(
      'Your data was restored with 2 thought records.',
    )
  })
})
