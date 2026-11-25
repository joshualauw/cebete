import { beforeEach, describe, expect, it } from 'vitest'

import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import type { ParsedBackup } from '@/backup/types'
import { db, SCHEMA_VERSION } from '@/db/db'
import { addMoodEntry, listMoodEntries } from '@/mood/repository'
import { backupText, currentEntry, currentTables, legacyEntry } from '@tests/helpers/backup'
import { oneEmotion } from '@tests/helpers/mood'

beforeEach(async () => {
  await db.moodEntries.clear()
})

function parsed(rows: readonly unknown[]): ParsedBackup {
  return {
    version: SCHEMA_VERSION,
    exportedAt: '2026-11-24T10:00:00.000Z',
    tables: { moodEntries: rows, thoughtRecords: [], copingItems: [] },
    counts: { moodEntries: rows.length, thoughtRecords: 0, copingItems: 0 },
  }
}

describe('restoreBackup: a full round trip', () => {
  it('gives back the same entries, with the same ids, notes and times, after the data is wiped', async () => {
    await addMoodEntry({ ...oneEmotion('calm', 4), note: 'a quiet morning' })
    await addMoodEntry({
      emotions: [
        { emotion: 'sad', intensity: 2 },
        { emotion: 'hopeful', intensity: 6 },
        { emotion: 'tired', intensity: 8 },
      ],
      note: 'mixed feelings',
    })
    await addMoodEntry(oneEmotion('happy', 9))
    const original = await db.moodEntries.orderBy('id').toArray()
    const text = serializeBackup(await createBackup())

    await db.moodEntries.clear()
    expect(await db.moodEntries.count()).toBe(0)
    await restoreBackup(parseBackup(text))

    expect(await db.moodEntries.orderBy('id').toArray()).toEqual(original)
    expect((await listMoodEntries()).map((entry) => entry.emotions.length)).toEqual([1, 3, 1])
  })

  it('replaces what is on the device, it does not merge', async () => {
    await addMoodEntry(oneEmotion('angry', 7))
    await addMoodEntry(oneEmotion('lonely', 3))

    await restoreBackup(parsed([currentEntry(10, 'calm', 4), currentEntry(11, 'happy', 8)]))

    const rows = await db.moodEntries.orderBy('id').toArray()

    expect(rows.map((row) => row.id)).toEqual([10, 11])
    expect(rows.map((row) => row.emotions[0]?.emotion)).toEqual(['calm', 'happy'])
  })

  it('empties the device when the backup holds no entries', async () => {
    await addMoodEntry(oneEmotion('calm', 4))

    await restoreBackup(parsed([]))

    expect(await db.moodEntries.count()).toBe(0)
  })

  it('also removes rows that could not be read, since the data now matches the backup exactly', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    await db.table('moodEntries').add({ createdAt: 10, intensity: 3 })

    await restoreBackup(parsed([currentEntry(5)]))

    expect(await db.moodEntries.count()).toBe(1)
  })

  it('lets new entries continue after the restored ones, without reusing an id', async () => {
    await restoreBackup(parsed([currentEntry(1), currentEntry(5)]))

    const added = await addMoodEntry(oneEmotion('calm', 4))

    expect(added.id).toBeGreaterThan(5)
  })

  it('restores a version 2 backup in the new layout', async () => {
    const text = backupText({
      version: 2,
      tables: {
        moodEntries: [legacyEntry(1, 'sad', 4, { note: 'low' }), legacyEntry(2, 'happy', 92)],
      },
    })

    await restoreBackup(parseBackup(text))

    expect((await listMoodEntries()).map((entry) => entry.emotions)).toEqual([
      [{ emotion: 'happy', intensity: 9 }],
      [{ emotion: 'sad', intensity: 0 }],
    ])
  })
})

describe('restoreBackup: all or nothing', () => {
  it('keeps the previous data exactly as it was when the restore fails part-way', async () => {
    await addMoodEntry({ ...oneEmotion('calm', 4), note: 'keep me' })
    await addMoodEntry(oneEmotion('sad', 2))
    const before = await db.moodEntries.orderBy('id').toArray()
    // Two rows share an id, so writing the second fails after the first was written.
    const broken = parsed([currentEntry(10), currentEntry(11), currentEntry(10, 'sad', 7)])

    await expect(restoreBackup(broken)).rejects.toThrow()

    expect(await db.moodEntries.orderBy('id').toArray()).toEqual(before)
  })

  it('does not leave a half-restored table behind', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    const broken = parsed([currentEntry(10), currentEntry(10)])

    await expect(restoreBackup(broken)).rejects.toThrow()

    const ids = (await db.moodEntries.toArray()).map((row) => row.id)

    expect(ids).not.toContain(10)
    expect(ids).toHaveLength(1)
  })
})

describe('refusing a file never changes the device', () => {
  it.each([
    ['not json', 'this is not json'],
    ['not a backup', '{"hello":"world"}'],
    ['from a newer version', backupText({ version: 99 })],
    ['damaged', backupText({ tables: currentTables([currentEntry(1), { id: 2 }]) })],
    [
      'holding duplicate ids',
      backupText({ tables: currentTables([currentEntry(1), currentEntry(1)]) }),
    ],
  ])('leaves everything as it was for a file that is %s', async (_label, text) => {
    await addMoodEntry({ ...oneEmotion('calm', 4), note: 'safe' })
    const before = await db.moodEntries.toArray()

    expect(() => parseBackup(text)).toThrow()

    expect(await db.moodEntries.toArray()).toEqual(before)
  })
})
