import { beforeEach, describe, expect, it } from 'vitest'

import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { db, SCHEMA_VERSION } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import { oneEmotion } from '@tests/helpers/mood'

beforeEach(async () => {
  await db.moodEntries.clear()
  // A new library starts with its starter items, and these tests count an empty one.
  await db.copingItems.clear()
})

describe('createBackup', () => {
  it('makes a backup with the app marker, the data version and an empty table when nothing is stored', async () => {
    const { file, counts, skipped } = await createBackup()

    expect(file.app).toBe('cebete')
    expect(file.version).toBe(SCHEMA_VERSION)
    expect(file.tables).toEqual({ moodEntries: [], thoughtRecords: [], copingItems: [] })
    expect(counts).toEqual({ moodEntries: 0, thoughtRecords: 0, copingItems: 0 })
    expect(skipped).toBe(0)
  })

  it('records when it was made, as a real date and time', async () => {
    const before = Date.now()
    const { file } = await createBackup()

    expect(new Date(file.exportedAt).toISOString()).toBe(file.exportedAt)
    expect(Date.parse(file.exportedAt)).toBeGreaterThanOrEqual(before - 1000)
  })

  it('holds every stored entry, with its id, emotions, ratings, note and time', async () => {
    const first = await addMoodEntry({ ...oneEmotion('calm', 4), note: 'a quiet morning' })
    const second = await addMoodEntry({
      emotions: [
        { emotion: 'sad', intensity: 2 },
        { emotion: 'hopeful', intensity: 6 },
      ],
    })

    const { file, counts } = await createBackup()

    expect(counts).toEqual({ moodEntries: 2, thoughtRecords: 0, copingItems: 0 })
    expect(file.tables.moodEntries).toHaveLength(2)
    expect(file.tables.moodEntries).toContainEqual(first)
    expect(file.tables.moodEntries).toContainEqual(second)
  })

  it('leaves out rows it cannot read, and says how many, so a backup can always be restored', async () => {
    const good = await addMoodEntry(oneEmotion('calm', 4))
    await db.table('moodEntries').add({ createdAt: 10, intensity: 3 })
    await db.table('moodEntries').add({ createdAt: 11, emotions: [] })

    const { file, counts, skipped } = await createBackup()

    expect(file.tables.moodEntries).toEqual([good])
    expect(counts).toEqual({ moodEntries: 1, thoughtRecords: 0, copingItems: 0 })
    expect(skipped).toBe(2)
    // The unreadable rows are not deleted from the device by making a backup.
    expect(await db.moodEntries.count()).toBe(3)
  })

  it('changes nothing on the device', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    const before = await db.moodEntries.toArray()

    await createBackup()

    expect(await db.moodEntries.toArray()).toEqual(before)
  })
})

describe('serializeBackup', () => {
  it('writes text that the restore side accepts, with the same entries', async () => {
    const saved = await addMoodEntry({ ...oneEmotion('grateful', 9), note: 'good news' })

    const text = serializeBackup(await createBackup())
    const parsed = parseBackup(text)

    expect(parsed.counts).toEqual({ moodEntries: 1, thoughtRecords: 0, copingItems: 0 })
    expect(parsed.tables.moodEntries).toEqual([saved])
  })

  it('writes readable, indented JSON', async () => {
    const text = serializeBackup(await createBackup())

    expect(text).toContain('\n  "app": "cebete"')
  })
})
