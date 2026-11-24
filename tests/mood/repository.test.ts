import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addMoodEntry, deleteMoodEntry, listMoodEntries } from '@/mood/repository'
import { NOTE_MAX_LENGTH } from '@/mood/types'
import { InvalidMoodEntryError } from '@/mood/validation'
import { oneEmotion } from '@tests/helpers/mood'

beforeEach(async () => {
  await db.moodEntries.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addMoodEntry', () => {
  it('saves an entry and returns it with an id and the time it was saved', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000)

    const saved = await addMoodEntry({ ...oneEmotion('calm', 3), note: 'after a walk' })

    expect(saved).toMatchObject({
      emotions: [{ emotion: 'calm', intensity: 3 }],
      note: 'after a walk',
      createdAt: 1_000,
    })
    expect(typeof saved.id).toBe('number')
    expect(await listMoodEntries()).toEqual([saved])
  })

  it('saves several emotions, each with its own rating, in the order they were chosen', async () => {
    const emotions = [
      { emotion: 'sad', intensity: 2 },
      { emotion: 'anxious', intensity: 7 },
      { emotion: 'hopeful', intensity: 5 },
    ] as const

    await addMoodEntry({ emotions })

    const [stored] = await listMoodEntries()

    expect(stored?.emotions).toEqual(emotions)
  })

  it('stamps the entry with the moment of saving when no time is given', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(5_000)

    const saved = await addMoodEntry(oneEmotion('happy', 8))

    expect(saved.createdAt).toBe(5_000)
    expect((await db.moodEntries.toArray()).map((entry) => entry.createdAt)).toEqual([5_000])
  })

  it('leaves a blank note out of the stored entry', async () => {
    await addMoodEntry({ ...oneEmotion('tired', 2), note: '   ' })

    const stored = await db.moodEntries.toArray()

    expect(stored).toHaveLength(1)
    expect(Object.keys(stored[0] ?? {})).not.toContain('note')
  })

  it.each([-1, 11, 100, 2.5, Number.NaN])(
    'rejects the rating %j and saves nothing',
    async (intensity) => {
      await expect(addMoodEntry(oneEmotion('calm', intensity))).rejects.toBeInstanceOf(
        InvalidMoodEntryError,
      )

      expect(await db.moodEntries.count()).toBe(0)
    },
  )

  it('rejects an entry with no emotion and saves nothing', async () => {
    await expect(addMoodEntry({ emotions: [] })).rejects.toBeInstanceOf(InvalidMoodEntryError)

    expect(await db.moodEntries.count()).toBe(0)
  })

  it('rejects more than three emotions and saves nothing', async () => {
    const emotions = [
      { emotion: 'calm', intensity: 5 },
      { emotion: 'happy', intensity: 5 },
      { emotion: 'sad', intensity: 5 },
      { emotion: 'tired', intensity: 5 },
    ] as const

    await expect(addMoodEntry({ emotions })).rejects.toBeInstanceOf(InvalidMoodEntryError)

    expect(await db.moodEntries.count()).toBe(0)
  })

  it('rejects the same emotion twice and saves nothing', async () => {
    const emotions = [
      { emotion: 'calm', intensity: 3 },
      { emotion: 'calm', intensity: 8 },
    ] as const

    await expect(addMoodEntry({ emotions })).rejects.toBeInstanceOf(InvalidMoodEntryError)

    expect(await db.moodEntries.count()).toBe(0)
  })

  it('rejects an over-long note and saves nothing', async () => {
    const note = 'a'.repeat(NOTE_MAX_LENGTH + 1)

    await expect(addMoodEntry({ ...oneEmotion('calm', 5), note })).rejects.toBeInstanceOf(
      InvalidMoodEntryError,
    )

    expect(await db.moodEntries.count()).toBe(0)
  })

  it('leaves existing entries untouched when a new one is rejected', async () => {
    const kept = await addMoodEntry(oneEmotion('calm', 1))

    await expect(addMoodEntry(oneEmotion('calm', 50))).rejects.toBeInstanceOf(InvalidMoodEntryError)

    expect(await listMoodEntries()).toEqual([kept])
  })
})

describe('listMoodEntries', () => {
  it('returns no entries when there are none', async () => {
    expect(await listMoodEntries()).toEqual([])
  })

  it('lists entries newest first', async () => {
    // Dexie reads the clock itself too, so set one fixed time per save, not a queue of values.
    const now = vi.spyOn(Date, 'now')

    now.mockReturnValue(1_000)
    await addMoodEntry(oneEmotion('calm', 1))
    now.mockReturnValue(3_000)
    await addMoodEntry(oneEmotion('sad', 2))
    now.mockReturnValue(2_000)
    await addMoodEntry(oneEmotion('happy', 3))

    const entries = await listMoodEntries()

    expect(entries.map((entry) => entry.emotions[0]?.emotion)).toEqual(['sad', 'happy', 'calm'])
    expect(entries.map((entry) => entry.createdAt)).toEqual([3_000, 2_000, 1_000])
  })

  it('puts the later save first when two entries share the same instant', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(7_000)

    await addMoodEntry(oneEmotion('calm', 1))
    await addMoodEntry(oneEmotion('sad', 2))

    const entries = await listMoodEntries()

    expect(entries.map((entry) => entry.emotions[0]?.emotion)).toEqual(['sad', 'calm'])
  })

  it('leaves out rows it cannot read, without breaking the list or deleting them', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const good = await addMoodEntry(oneEmotion('calm', 4))
    // Rows like these should not exist, but if one ever does, the list must still work.
    await db.table('moodEntries').add({ createdAt: 10, intensity: 3 })
    await db.table('moodEntries').add({ createdAt: 11, emotion: 'calm', intensity: 50 })
    await db.table('moodEntries').add({ createdAt: 12, emotions: [] })

    const entries = await listMoodEntries()

    expect(entries).toEqual([good])
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('3 saved mood entries'))
    expect(await db.moodEntries.count()).toBe(4)
  })
})

describe('deleteMoodEntry', () => {
  it('removes only the chosen entry', async () => {
    const first = await addMoodEntry(oneEmotion('calm', 1))
    const second = await addMoodEntry(oneEmotion('sad', 2))
    const third = await addMoodEntry(oneEmotion('happy', 3))

    await deleteMoodEntry(second.id)

    const remaining = await listMoodEntries()

    // Newest first, so the later save comes first.
    expect(remaining.map((entry) => entry.id)).toEqual([third.id, first.id])
  })

  it('does nothing when the entry is already gone', async () => {
    const kept = await addMoodEntry(oneEmotion('calm', 1))

    await expect(deleteMoodEntry(kept.id + 1000)).resolves.toBeUndefined()

    expect(await listMoodEntries()).toEqual([kept])
  })
})

describe('persistence', () => {
  it('keeps entries after the database is closed and reopened', async () => {
    const saved = await addMoodEntry({ ...oneEmotion('grateful', 9), note: 'good news' })

    db.close()
    await db.open()

    expect(await listMoodEntries()).toEqual([saved])
  })
})
