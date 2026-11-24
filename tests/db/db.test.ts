import Dexie from 'dexie'
import { afterEach, describe, expect, it } from 'vitest'

import { CebeteDb, DB_NAME, SCHEMA_VERSION } from '@/db/db'

const openedDatabases: CebeteDb[] = []

async function openTestDb(): Promise<CebeteDb> {
  const testDb = new CebeteDb(`${DB_NAME}-test-${crypto.randomUUID()}`)
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

describe('CebeteDb', () => {
  it('opens with the current schema version', async () => {
    const testDb = await openTestDb()

    expect(testDb.isOpen()).toBe(true)
    expect(testDb.verno).toBe(SCHEMA_VERSION)
  })

  it('starts with no tables, so feature modules own their own data', async () => {
    const testDb = await openTestDb()

    expect(testDb.tables).toHaveLength(0)
  })

  it('keeps the same schema version when reopened', async () => {
    const first = await openTestDb()
    first.close()

    const reopened = new CebeteDb(first.name)
    openedDatabases.push(reopened)
    await reopened.open()

    expect(reopened.verno).toBe(SCHEMA_VERSION)
  })
})
