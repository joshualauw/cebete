import { describe, expect, it } from 'vitest'

import { backupTables, unregisteredTables } from '@/backup/registry'
import { db, SCHEMA_VERSION } from '@/db/db'

describe('backup registry', () => {
  it('lists every table the database has, so nothing is left out of a backup', () => {
    const tableNames = db.tables.map((table) => table.name)

    expect(unregisteredTables(tableNames)).toEqual([])
  })

  it('lists no table that the database does not have', () => {
    const tableNames = db.tables.map((table) => table.name)

    expect(Object.keys(backupTables).sort()).toEqual([...tableNames].sort())
  })

  it('would notice a table that a future module adds and forgets to register', () => {
    const tableNames = [...db.tables.map((table) => table.name), 'sleepLogs', 'activities']

    expect(unregisteredTables(tableNames)).toEqual(['sleepLogs', 'activities'])
  })

  it('knows, for each table, the version it first appeared in and what to call its rows', () => {
    for (const table of Object.values(backupTables)) {
      expect(table.since).toBeGreaterThanOrEqual(1)
      expect(table.since).toBeLessThanOrEqual(SCHEMA_VERSION)
      expect(table.label.one).not.toBe('')
      expect(table.label.other).not.toBe('')
    }
  })
})
