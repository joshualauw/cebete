import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { db } from '@/db/db'
import { MoodEntryNotFoundError } from '@/mood/errors'
import { addMoodEntry, deleteMoodEntry, listMoodEntries, updateMoodEntry } from '@/mood/repository'
import type { MoodEntryChanges } from '@/mood/types'
import { InvalidMoodEntryError } from '@/mood/validation'
import { oneEmotion } from '@tests/helpers/mood'

const NOW = 10_000_000

beforeEach(async () => {
  await db.moodEntries.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function addAt(time: number, entry = oneEmotion('calm', 4)): Promise<number> {
  vi.spyOn(Date, 'now').mockReturnValue(time)
  const saved = await addMoodEntry(entry)

  return saved.id
}

describe('updateMoodEntry', () => {
  it('changes the emotions, the ratings, the note and the time, and keeps the id', async () => {
    const id = await addAt(1_000, { ...oneEmotion('calm', 4), note: 'first' })

    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    const updated = await updateMoodEntry(id, {
      emotions: [
        { emotion: 'sad', intensity: 2 },
        { emotion: 'hopeful', intensity: 9 },
      ],
      note: 'second',
      createdAt: 5_000,
    })

    expect(updated).toEqual({
      id,
      emotions: [
        { emotion: 'sad', intensity: 2 },
        { emotion: 'hopeful', intensity: 9 },
      ],
      note: 'second',
      createdAt: 5_000,
    })
    expect(await db.moodEntries.toArray()).toEqual([updated])
  })

  it('removes a note that was cleared instead of keeping the old one', async () => {
    const id = await addAt(1_000, { ...oneEmotion('calm', 4), note: 'remove me' })

    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    await updateMoodEntry(id, { ...oneEmotion('calm', 4), note: '  ', createdAt: 1_000 })

    const [stored] = await db.moodEntries.toArray()

    expect(stored).toBeDefined()
    expect(stored && 'note' in stored).toBe(false)
  })

  it('keeps an unchanged time to the millisecond', async () => {
    const id = await addAt(1_234_567)

    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    await updateMoodEntry(id, { ...oneEmotion('happy', 8), createdAt: 1_234_567 })

    expect((await db.moodEntries.get(id))?.createdAt).toBe(1_234_567)
  })

  it('does not touch the other entries', async () => {
    const first = await addAt(1_000, oneEmotion('calm', 1))
    const second = await addAt(2_000, oneEmotion('sad', 2))
    const before = await db.moodEntries.get(second)

    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    await updateMoodEntry(first, { ...oneEmotion('happy', 9), createdAt: 1_000 })

    expect(await db.moodEntries.get(second)).toEqual(before)
    expect(await db.moodEntries.count()).toBe(2)
  })

  it('moves an entry to its new place in the newest-first list when its time changes', async () => {
    const older = await addAt(1_000, oneEmotion('calm', 1))
    const newer = await addAt(2_000, oneEmotion('sad', 2))

    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    expect((await listMoodEntries()).map((entry) => entry.id)).toEqual([newer, older])

    await updateMoodEntry(older, { ...oneEmotion('calm', 1), createdAt: 3_000 })

    expect((await listMoodEntries()).map((entry) => entry.id)).toEqual([older, newer])
  })

  it.each<readonly [string, MoodEntryChanges]>([
    ['no emotion', { emotions: [], createdAt: 1_000 }],
    [
      'a repeated emotion',
      {
        emotions: [
          { emotion: 'calm', intensity: 1 },
          { emotion: 'calm', intensity: 2 },
        ],
        createdAt: 1_000,
      },
    ],
    ['a rating out of range', { emotions: [{ emotion: 'calm', intensity: 11 }], createdAt: 1_000 }],
    [
      'a note that is too long',
      { ...oneEmotion('calm', 4), note: 'x'.repeat(501), createdAt: 1_000 },
    ],
    ['a time in the future', { ...oneEmotion('calm', 4), createdAt: NOW + 1 }],
    ['an invalid time', { ...oneEmotion('calm', 4), createdAt: Number.NaN }],
  ])('refuses %s and changes nothing', async (_name, changes) => {
    const id = await addAt(1_000, { ...oneEmotion('calm', 4), note: 'keep me' })
    const before = await db.moodEntries.toArray()

    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    await expect(updateMoodEntry(id, changes)).rejects.toBeInstanceOf(InvalidMoodEntryError)
    expect(await db.moodEntries.toArray()).toEqual(before)
  })

  it('saves nothing and creates nothing when the entry is gone', async () => {
    const id = await addAt(1_000)

    await deleteMoodEntry(id)
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    await expect(
      updateMoodEntry(id, { ...oneEmotion('happy', 8), createdAt: 1_000 }),
    ).rejects.toBeInstanceOf(MoodEntryNotFoundError)
    expect(await db.moodEntries.count()).toBe(0)
  })

  it('leaves an entry that is still valid for the backup, and it round-trips', async () => {
    const id = await addAt(1_000, { ...oneEmotion('calm', 4), note: 'old' })

    vi.spyOn(Date, 'now').mockReturnValue(NOW)
    await updateMoodEntry(id, { ...oneEmotion('sad', 7), note: 'edited', createdAt: 500 })
    const edited = await db.moodEntries.toArray()
    const backup = await createBackup()

    expect(backup.skipped).toBe(0)

    await db.moodEntries.clear()
    await restoreBackup(parseBackup(serializeBackup(backup)))

    expect(await db.moodEntries.toArray()).toEqual(edited)
  })
})
