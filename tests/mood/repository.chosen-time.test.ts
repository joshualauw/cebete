import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { db } from '@/db/db'
import { addMoodEntry, listMoodEntries } from '@/mood/repository'
import { oneEmotion } from '@tests/helpers/mood'

const NOW = 10_000_000

beforeEach(async () => {
  await db.moodEntries.clear()
  vi.spyOn(Date, 'now').mockReturnValue(NOW)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addMoodEntry: a chosen time', () => {
  it('stamps an entry with the moment of saving when no time is given', async () => {
    const saved = await addMoodEntry(oneEmotion('calm', 4))

    expect(saved.createdAt).toBe(NOW)
  })

  it('stamps the moment of saving when the time is explicitly left out', async () => {
    const saved = await addMoodEntry({ ...oneEmotion('calm', 4), createdAt: undefined })

    expect(saved.createdAt).toBe(NOW)
  })

  it('keeps exactly the time it is given, to the millisecond', async () => {
    const saved = await addMoodEntry({ ...oneEmotion('calm', 4), createdAt: 1_234_567 })

    expect(saved.createdAt).toBe(1_234_567)
    expect((await db.moodEntries.get(saved.id))?.createdAt).toBe(1_234_567)
  })

  it('accepts a time of exactly now', async () => {
    const saved = await addMoodEntry({ ...oneEmotion('calm', 4), createdAt: NOW })

    expect(saved.createdAt).toBe(NOW)
  })

  it.each<readonly [string, number]>([
    ['in the future', NOW + 1],
    ['not a real moment', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('refuses a time that is %s, and saves nothing', async (_name, createdAt) => {
    await expect(addMoodEntry({ ...oneEmotion('calm', 4), createdAt })).rejects.toMatchObject({
      name: 'InvalidMoodEntryError',
      field: 'time',
    })
    expect(await db.moodEntries.count()).toBe(0)
  })

  it('still applies the usual rules to the rest of the entry', async () => {
    await expect(addMoodEntry({ emotions: [], createdAt: 1_000 })).rejects.toMatchObject({
      field: 'emotions',
    })
    expect(await db.moodEntries.count()).toBe(0)
  })

  it('puts a back-dated entry where its time places it in the newest-first list', async () => {
    const middle = await addMoodEntry({ ...oneEmotion('calm', 1), createdAt: 2_000 })
    const newest = await addMoodEntry({ ...oneEmotion('sad', 2), createdAt: 3_000 })
    const oldest = await addMoodEntry({ ...oneEmotion('happy', 3), createdAt: 1_000 })

    expect((await listMoodEntries()).map((entry) => entry.id)).toEqual([
      newest.id,
      middle.id,
      oldest.id,
    ])
  })

  it('is valid for the backup, and round-trips with the same time', async () => {
    await addMoodEntry({ ...oneEmotion('calm', 4), note: 'late entry', createdAt: 1_234_567 })
    const original = await db.moodEntries.toArray()
    const backup = await createBackup()

    expect(backup.skipped).toBe(0)

    await db.moodEntries.clear()
    await restoreBackup(parseBackup(serializeBackup(backup)))

    expect(await db.moodEntries.toArray()).toEqual(original)
  })
})
