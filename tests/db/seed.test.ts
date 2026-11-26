import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

import { starterItems } from '@/coping/starters'
import { CebeteDb, DB_NAME } from '@/db/db'

const openedDatabases: CebeteDb[] = []

function testDbName(): string {
  return `${DB_NAME}-seed-test-${crypto.randomUUID()}`
}

async function openTestDb(name: string = testDbName()): Promise<CebeteDb> {
  const testDb = new CebeteDb(name)
  openedDatabases.push(testDb)
  await testDb.open()
  return testDb
}

afterEach(async () => {
  for (const testDb of openedDatabases.splice(0)) {
    testDb.close()
    await Dexie.delete(testDb.name)
  }
})

describe('a brand-new database', () => {
  it('starts the coping library with the three starter techniques, in order', async () => {
    const testDb = await openTestDb()

    const items = await testDb.copingItems.orderBy('id').toArray()

    expect(items.map(({ type, text, detail }) => ({ type, text, detail }))).toEqual(
      starterItems().map(({ type, text, detail }) => ({ type, text, detail })),
    )
    expect(items.map((item) => item.text)).toEqual([
      'Slow breathing',
      'Grounding: 5, 4, 3, 2, 1',
      'Muscle relaxation',
    ])
  })

  it('gives the starters ordinary ids, one after the other, so new items follow them', async () => {
    const testDb = await openTestDb()

    const ids = (await testDb.copingItems.orderBy('id').toArray()).map((item) => item.id)
    const added = await testDb.copingItems.add({ type: 'say', text: 'This will pass' })

    expect(ids).toEqual([...ids].sort((a, b) => a - b))
    expect(added).toBeGreaterThan(Math.max(...ids))
  })

  it('leaves every other table empty: only the library is seeded', async () => {
    const testDb = await openTestDb()

    expect(await testDb.moodEntries.count()).toBe(0)
    expect(await testDb.thoughtRecords.count()).toBe(0)
  })
})

describe('seeding only once', () => {
  it('does not add the starters again when the database is reopened', async () => {
    const first = await openTestDb()
    first.close()

    const reopened = await openTestDb(first.name)

    expect(await reopened.copingItems.count()).toBe(3)
  })

  it('does not bring back a starter that was deleted, even after reopening', async () => {
    const first = await openTestDb()
    const [slow] = await first.copingItems.orderBy('id').toArray()

    if (!slow) {
      throw new Error('The starters were not added')
    }
    await first.copingItems.delete(slow.id)
    first.close()

    const reopened = await openTestDb(first.name)

    expect((await reopened.copingItems.orderBy('id').toArray()).map((item) => item.text)).toEqual([
      'Grounding: 5, 4, 3, 2, 1',
      'Muscle relaxation',
    ])
  })

  it('does not bring them back when the user deleted every one of them', async () => {
    const first = await openTestDb()
    await first.copingItems.clear()
    first.close()

    const reopened = await openTestDb(first.name)

    expect(await reopened.copingItems.count()).toBe(0)
  })

  it('keeps what the user edited in a starter, even after reopening', async () => {
    const first = await openTestDb()
    const [slow] = await first.copingItems.orderBy('id').toArray()

    if (!slow) {
      throw new Error('The starters were not added')
    }
    await first.copingItems.put({ ...slow, text: 'My own breathing', detail: 'In, out' })
    first.close()

    const reopened = await openTestDb(first.name)

    expect(await reopened.copingItems.get(slow.id)).toEqual({
      id: slow.id,
      type: 'do',
      text: 'My own breathing',
      detail: 'In, out',
    })
    expect(await reopened.copingItems.count()).toBe(3)
  })

  it('seeds again only for a database that is created again, after being deleted', async () => {
    const first = await openTestDb()
    await first.copingItems.clear()
    first.close()
    await Dexie.delete(first.name)

    const again = await openTestDb(first.name)

    expect(await again.copingItems.count()).toBe(3)
  })
})

describe('an existing database is left alone', () => {
  it('is not seeded when a database made by version 4 is upgraded', async () => {
    const name = testDbName()
    const old = new Dexie(name)

    old.version(1).stores({})
    old.version(2).stores({ moodEntries: '++id, createdAt' })
    old.version(3).stores({ moodEntries: '++id, createdAt' })
    old.version(4).stores({ moodEntries: '++id, createdAt', thoughtRecords: '++id, createdAt' })
    await old.open()
    await old.table('moodEntries').add({
      emotions: [{ emotion: 'calm', intensity: 4 }],
      note: 'kept',
      createdAt: 100,
    })
    old.close()

    const upgraded = await openTestDb(name)

    expect(await upgraded.copingItems.count()).toBe(0)
    expect(await upgraded.moodEntries.count()).toBe(1)
  })

  it('is not seeded when a database already at version 5 is opened, whatever it holds', async () => {
    const name = testDbName()
    const old = new Dexie(name)

    old.version(1).stores({})
    old.version(2).stores({ moodEntries: '++id, createdAt' })
    old.version(3).stores({ moodEntries: '++id, createdAt' })
    old.version(4).stores({ moodEntries: '++id, createdAt', thoughtRecords: '++id, createdAt' })
    old.version(5).stores({
      moodEntries: '++id, createdAt',
      thoughtRecords: '++id, createdAt',
      copingItems: '++id',
    })
    await old.open()
    await old.table('copingItems').add({ type: 'do', text: 'Only mine' })
    old.close()

    const reopened = await openTestDb(name)

    expect((await reopened.copingItems.toArray()).map((item) => item.text)).toEqual(['Only mine'])
  })

  it('is not seeded when a version 5 database with an empty library is opened', async () => {
    const name = testDbName()
    const old = new Dexie(name)

    old.version(1).stores({})
    old.version(2).stores({ moodEntries: '++id, createdAt' })
    old.version(3).stores({ moodEntries: '++id, createdAt' })
    old.version(4).stores({ moodEntries: '++id, createdAt', thoughtRecords: '++id, createdAt' })
    old.version(5).stores({
      moodEntries: '++id, createdAt',
      thoughtRecords: '++id, createdAt',
      copingItems: '++id',
    })
    await old.open()
    old.close()

    const reopened = await openTestDb(name)

    expect(await reopened.copingItems.count()).toBe(0)
  })
})
