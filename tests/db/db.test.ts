import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

import { CebeteDb, DB_NAME, SCHEMA_VERSION } from '@/db/db'
import { isMoodEntry } from '@/mood/validation'

const openedDatabases: CebeteDb[] = []

function testDbName(): string {
  return `${DB_NAME}-test-${crypto.randomUUID()}`
}

async function openTestDb(name: string = testDbName()): Promise<CebeteDb> {
  const testDb = new CebeteDb(name)
  openedDatabases.push(testDb)
  await testDb.open()
  return testDb
}

/** Makes a database the way the app did before this change: version 2, one emotion per entry. */
async function createVersion2Database(name: string, rows: readonly object[]): Promise<void> {
  const old = new Dexie(name)
  old.version(1).stores({})
  old.version(2).stores({ moodEntries: '++id, createdAt' })
  await old.open()
  await old.table('moodEntries').bulkAdd([...rows])
  old.close()
}

async function readRows(database: CebeteDb): Promise<unknown[]> {
  const rows: unknown[] = await database.table('moodEntries').toArray()
  return rows
}

afterEach(async () => {
  for (const testDb of openedDatabases.splice(0)) {
    testDb.close()
    await Dexie.delete(testDb.name)
  }
})

describe('CebeteDb', () => {
  it('opens with the current schema version', async () => {
    const testDb = await openTestDb()

    expect(testDb.isOpen()).toBe(true)
    expect(testDb.verno).toBe(SCHEMA_VERSION)
  })

  it('has a table for mood entries and one for thought records, and no others yet', async () => {
    const testDb = await openTestDb()

    expect(testDb.tables.map((table) => table.name).sort()).toEqual([
      'moodEntries',
      'thoughtRecords',
    ])
  })

  it('keeps the same schema version when reopened', async () => {
    const first = await openTestDb()
    first.close()

    const reopened = await openTestDb(first.name)

    expect(reopened.verno).toBe(SCHEMA_VERSION)
  })

  it('upgrades a database created at version 1 straight to the current version', async () => {
    const name = testDbName()
    const old = new Dexie(name)
    old.version(1).stores({})
    await old.open()
    old.close()

    const upgraded = await openTestDb(name)

    expect(upgraded.verno).toBe(SCHEMA_VERSION)
    expect(upgraded.tables.map((table) => table.name).sort()).toEqual([
      'moodEntries',
      'thoughtRecords',
    ])

    await upgraded.moodEntries.add({
      emotions: [{ emotion: 'calm', intensity: 4 }],
      createdAt: 1,
    })
    expect(await upgraded.moodEntries.count()).toBe(1)
  })
})

describe('CebeteDb: upgrading entries saved by the previous version', () => {
  const oldRows = [
    { emotion: 'sad', intensity: 4, note: 'low', createdAt: 100 },
    { emotion: 'calm', intensity: 5, createdAt: 200 },
    { emotion: 'anxious', intensity: 50, note: 'middle', createdAt: 300 },
    { emotion: 'happy', intensity: 92, createdAt: 400 },
    { emotion: 'grateful', intensity: 100, note: 'top', createdAt: 500 },
    { emotion: 'tired', intensity: 0, createdAt: 600 },
  ]

  it('converts every entry to one emotion on the 0 to 10 scale, losing none', async () => {
    const name = testDbName()
    await createVersion2Database(name, oldRows)

    const upgraded = await openTestDb(name)
    const entries = await upgraded.moodEntries.orderBy('createdAt').toArray()

    expect(entries).toHaveLength(oldRows.length)
    expect(entries.map((entry) => entry.emotions)).toEqual([
      [{ emotion: 'sad', intensity: 0 }],
      [{ emotion: 'calm', intensity: 1 }],
      [{ emotion: 'anxious', intensity: 5 }],
      [{ emotion: 'happy', intensity: 9 }],
      [{ emotion: 'grateful', intensity: 10 }],
      [{ emotion: 'tired', intensity: 0 }],
    ])
  })

  it('keeps each entry id, note and time, and leaves no old fields behind', async () => {
    const name = testDbName()
    await createVersion2Database(name, oldRows)

    const upgraded = await openTestDb(name)
    const rows = await readRows(upgraded)

    expect(rows).toEqual([
      { id: 1, createdAt: 100, note: 'low', emotions: [{ emotion: 'sad', intensity: 0 }] },
      { id: 2, createdAt: 200, emotions: [{ emotion: 'calm', intensity: 1 }] },
      { id: 3, createdAt: 300, note: 'middle', emotions: [{ emotion: 'anxious', intensity: 5 }] },
      { id: 4, createdAt: 400, emotions: [{ emotion: 'happy', intensity: 9 }] },
      { id: 5, createdAt: 500, note: 'top', emotions: [{ emotion: 'grateful', intensity: 10 }] },
      { id: 6, createdAt: 600, emotions: [{ emotion: 'tired', intensity: 0 }] },
    ])
  })

  it('makes entries the rest of the app accepts', async () => {
    const name = testDbName()
    await createVersion2Database(name, oldRows)

    const rows = await readRows(await openTestDb(name))

    expect(rows.every(isMoodEntry)).toBe(true)
  })

  it('lets new entries be added after the upgrade, continuing the ids', async () => {
    const name = testDbName()
    await createVersion2Database(name, oldRows)

    const upgraded = await openTestDb(name)
    const id = await upgraded.moodEntries.add({
      emotions: [{ emotion: 'calm', intensity: 6 }],
      createdAt: 700,
    })

    expect(id).toBe(oldRows.length + 1)
  })

  it('changes nothing the second time the database is opened', async () => {
    const name = testDbName()
    await createVersion2Database(name, oldRows)
    const first = await openTestDb(name)
    const afterUpgrade = await readRows(first)
    first.close()

    const reopened = await openTestDb(name)

    expect(await readRows(reopened)).toEqual(afterUpgrade)
  })

  it('never stops the app from opening because of a damaged row, and keeps that row', async () => {
    const damaged = [
      { intensity: 40, createdAt: 10 },
      { emotion: 'bogus', intensity: 50, createdAt: 11 },
      { emotion: 'calm', intensity: 'high', createdAt: 12 },
      { emotion: 'calm', createdAt: 13 },
    ]
    const name = testDbName()
    await createVersion2Database(name, [...oldRows, ...damaged])

    const upgraded = await openTestDb(name)
    const rows = await readRows(upgraded)

    expect(upgraded.isOpen()).toBe(true)
    expect(rows).toHaveLength(oldRows.length + damaged.length)
    expect(rows.filter(isMoodEntry)).toHaveLength(oldRows.length)
    for (const row of damaged) {
      expect(rows).toContainEqual(expect.objectContaining(row))
    }
  })

  it('repairs an out-of-range rating instead of failing', async () => {
    const name = testDbName()
    await createVersion2Database(name, [
      { emotion: 'calm', intensity: 250, createdAt: 1 },
      { emotion: 'sad', intensity: -30, createdAt: 2 },
    ])

    const entries = await (await openTestDb(name)).moodEntries.orderBy('createdAt').toArray()

    expect(entries.map((entry) => entry.emotions[0]?.intensity)).toEqual([10, 0])
  })

  it('opens an empty version 2 database without trouble', async () => {
    const name = testDbName()
    await createVersion2Database(name, [])

    const upgraded = await openTestDb(name)

    expect(upgraded.verno).toBe(SCHEMA_VERSION)
    expect(await upgraded.moodEntries.count()).toBe(0)
  })
})

describe('CebeteDb: upgrading a database made by version 3', () => {
  it('keeps the mood entries and adds an empty table for thought records', async () => {
    const name = testDbName()
    const old = new Dexie(name)

    old.version(1).stores({})
    old.version(2).stores({ moodEntries: '++id, createdAt' })
    old.version(3).stores({ moodEntries: '++id, createdAt' })
    await old.open()
    await old.table('moodEntries').bulkAdd([
      { emotions: [{ emotion: 'calm', intensity: 4 }], note: 'kept', createdAt: 100 },
      { emotions: [{ emotion: 'sad', intensity: 7 }], createdAt: 200 },
    ])
    old.close()

    const upgraded = await openTestDb(name)

    expect(upgraded.verno).toBe(SCHEMA_VERSION)
    expect(await upgraded.moodEntries.count()).toBe(2)
    expect((await upgraded.moodEntries.orderBy('createdAt').toArray())[0]).toMatchObject({
      emotions: [{ emotion: 'calm', intensity: 4 }],
      note: 'kept',
    })
    expect(await upgraded.thoughtRecords.count()).toBe(0)
  })
})
