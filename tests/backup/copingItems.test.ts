import { beforeEach, describe, expect, it } from 'vitest'

import { createBackup, serializeBackup } from '@/backup/export'
import { parseBackup } from '@/backup/parse'
import { restoreBackup } from '@/backup/restore'
import { addCopingItem, listCopingItems } from '@/coping/repository'
import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import { backupText, currentEntry, currentTables } from '@tests/helpers/backup'
import { copingItem } from '@tests/helpers/coping'
import { oneEmotion } from '@tests/helpers/mood'

beforeEach(async () => {
  await db.copingItems.clear()
  await db.moodEntries.clear()
})

describe('backing up the coping library', () => {
  it('gives back the same items, with their ids, kinds and details, after the data is wiped', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing', 'in 4, out 6'))
    await addCopingItem(copingItem('say', 'This will pass'))
    await addCopingItem(copingItem('about', 'Good listener'))
    const original = await db.copingItems.orderBy('id').toArray()
    const text = serializeBackup(await createBackup())

    await db.copingItems.clear()
    await restoreBackup(parseBackup(text))

    expect(await db.copingItems.orderBy('id').toArray()).toEqual(original)
    expect((await listCopingItems()).map((item) => item.text)).toEqual([
      'Slow breathing',
      'This will pass',
      'Good listener',
    ])
  })

  it('counts the items under their own name in the backup', async () => {
    await addCopingItem(copingItem('do', 'Walk'))
    await addCopingItem(copingItem('do', 'Breathe'))

    const backup = await createBackup()

    expect(backup.counts.copingItems).toBe(2)
    expect(backup.file.tables.copingItems).toHaveLength(2)
  })

  it('replaces the items on the device, it does not merge', async () => {
    await addCopingItem(copingItem('do', 'Old item'))

    await restoreBackup(
      parseBackup(
        backupText({
          tables: currentTables([], [], [{ id: 7, type: 'say', text: 'Backed-up item' }]),
        }),
      ),
    )

    expect((await db.copingItems.toArray()).map((item) => item.text)).toEqual(['Backed-up item'])
  })

  it('lets new items continue after the restored ones, without reusing an id', async () => {
    await restoreBackup(
      parseBackup(
        backupText({ tables: currentTables([], [], [{ id: 5, type: 'do', text: 'Walk' }]) }),
      ),
    )

    const added = await addCopingItem(copingItem('do', 'Breathe'))

    expect(added.id).toBeGreaterThan(5)
  })
})

describe('an older backup', () => {
  it('restores a version 4 backup with an empty library and the rest intact', async () => {
    await addCopingItem(copingItem('do', 'Walk'))
    const text = backupText({
      version: 4,
      tables: { moodEntries: [currentEntry(1, 'sad', 7)], thoughtRecords: [] },
    })

    await restoreBackup(parseBackup(text))

    expect(await db.copingItems.count()).toBe(0)
    expect(await db.moodEntries.count()).toBe(1)
  })

  it('does not accept a current backup that is missing the coping items table', () => {
    const text = backupText({ tables: { moodEntries: [], thoughtRecords: [] } })

    expect(() => parseBackup(text)).toThrow()
  })
})

describe('a damaged coping item in a backup', () => {
  it.each([
    ['an unknown kind', { id: 1, type: 'sing', text: 'La la' }],
    ['no text', { id: 1, type: 'do' }],
    ['no id', { type: 'do', text: 'Walk' }],
  ])(
    'refuses a file with an item that has %s, and leaves the device as it was',
    async (_l, row) => {
      await addMoodEntry(oneEmotion('calm', 4))
      await addCopingItem(copingItem('do', 'Safe'))
      const before = await db.copingItems.toArray()

      expect(() => parseBackup(backupText({ tables: currentTables([], [], [row]) }))).toThrow()

      expect(await db.copingItems.toArray()).toEqual(before)
    },
  )

  it('refuses a file where two items share an id', () => {
    const rows = [
      { id: 1, type: 'do', text: 'Walk' },
      { id: 1, type: 'do', text: 'Breathe' },
    ]

    expect(() => parseBackup(backupText({ tables: currentTables([], [], rows) }))).toThrow()
  })
})
