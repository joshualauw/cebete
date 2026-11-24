import Dexie from 'dexie'

export const DB_NAME = 'cebete'

/**
 * Current schema version. Later modules add their tables by raising this number
 * and declaring a new version, so existing data is migrated instead of lost.
 */
export const SCHEMA_VERSION = 1

export class CebeteDb extends Dexie {
  constructor(name: string = DB_NAME) {
    super(name)
    // No tables yet: feature modules extend the schema in their own tickets.
    this.version(SCHEMA_VERSION).stores({})
  }
}

export const db = new CebeteDb()
