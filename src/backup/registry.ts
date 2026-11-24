import { convertLegacyEntry } from '@/mood/migration'
import { isMoodEntry } from '@/mood/validation'

/** How one stored table takes part in a backup. */
export type BackupTable = {
  /** The data version in which this table first existed. Older backups hold none of it. */
  readonly since: number
  /** What the rows are called, for messages such as "3 mood entries". */
  readonly label: { readonly one: string; readonly other: string }
  /** Brings rows written by an older data version up to date, as they come out of a backup. */
  readonly upgrade: (rows: readonly unknown[], fromVersion: number) => readonly unknown[]
  /** Whether a row is a complete, valid row in the current layout. */
  readonly isValidRow: (row: unknown) => boolean
}

/**
 * Every table that is backed up, by its database name. A table that is not listed here is not
 * in the backup, so a test checks this list against the database: a future module that adds a
 * table cannot forget to join the backup.
 */
/** The tables, out of the given names, that are not part of the backup. It should be empty. */
export function unregisteredTables(tableNames: readonly string[]): string[] {
  return tableNames.filter((name) => !(name in backupTables))
}

export const backupTables: Readonly<Record<string, BackupTable>> = {
  moodEntries: {
    since: 2,
    label: { one: 'mood entry', other: 'mood entries' },
    // Before version 3, an entry held one emotion rated 0 to 100.
    upgrade: (rows, fromVersion) =>
      fromVersion < 3 ? rows.map((row) => convertLegacyEntry(row)) : rows,
    isValidRow: isMoodEntry,
  },
}
