import Dexie, { type EntityTable, type Transaction } from 'dexie'

import { convertLegacyEntry } from '@/mood/migration'
import type { MoodEntry } from '@/mood/types'

export const DB_NAME = 'cebete'

/**
 * Current schema version. Feature modules add their tables by raising this number and
 * declaring a new version, so existing data is migrated instead of lost. Old versions stay
 * declared below, because a device may still hold a database created by one of them.
 */
export const SCHEMA_VERSION = 3

const MOOD_ENTRIES = 'moodEntries'

/** Moves entries saved in the old single-emotion layout to the new one. */
async function upgradeMoodEntries(transaction: Transaction): Promise<void> {
  await transaction
    .table(MOOD_ENTRIES)
    .toCollection()
    .modify((row: unknown, context: { value: unknown }) => {
      const converted = convertLegacyEntry(row)

      // Rows that need no change are not written again.
      if (converted !== row) {
        context.value = converted
      }
    })
}

export class CebeteDb extends Dexie {
  /** Mood entries, listed by the time they were recorded. */
  declare moodEntries: EntityTable<MoodEntry, 'id'>

  constructor(name: string = DB_NAME) {
    super(name)

    // Version 1: the empty starting point, before any feature stored data.
    this.version(1).stores({})
    // Version 2: adds the mood entries table, one emotion with a 0 to 100 intensity each.
    this.version(2).stores({ [MOOD_ENTRIES]: '++id, createdAt' })
    // Version 3: entries hold one to three emotions, each rated 0 to 10. The table's indexes
    // are unchanged, and entries saved before are converted when the app first opens.
    this.version(SCHEMA_VERSION)
      .stores({ [MOOD_ENTRIES]: '++id, createdAt' })
      .upgrade(upgradeMoodEntries)
  }
}

export const db = new CebeteDb()
