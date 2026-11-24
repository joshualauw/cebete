import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addMoodEntry, listMoodEntries } from '@/mood/repository'
import { oneEmotion } from '@tests/helpers/mood'

// The report remembers what it last said, so every test starts from "nothing unreadable".
beforeEach(async () => {
  await db.moodEntries.clear()
  await listMoodEntries()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function addDamagedRow(createdAt: number): Promise<void> {
  await db.table('moodEntries').add({ createdAt, intensity: 3 })
}

describe('listMoodEntries: reporting rows it cannot read', () => {
  it('says nothing when every row can be read', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await addMoodEntry(oneEmotion('calm', 4))

    await listMoodEntries()

    expect(warn).not.toHaveBeenCalled()
  })

  it('uses the singular for one unreadable row', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await addDamagedRow(1)

    await listMoodEntries()

    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '1 saved mood entry could not be read and is not shown',
    )
  })

  it('uses the plural for several unreadable rows', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await addDamagedRow(1)
    await addDamagedRow(2)

    await listMoodEntries()

    expect(warn).toHaveBeenCalledExactlyOnceWith(
      '2 saved mood entries could not be read and are not shown',
    )
  })

  it('reports the same problem once, not on every refresh of the list', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await addDamagedRow(1)

    await listMoodEntries()
    await listMoodEntries()
    await listMoodEntries()

    expect(warn).toHaveBeenCalledOnce()
  })

  it('reports again when the number of unreadable rows changes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    await addDamagedRow(1)
    await listMoodEntries()

    await addDamagedRow(2)
    await listMoodEntries()

    expect(warn).toHaveBeenCalledTimes(2)
  })
})
