/** The marker that says a file is a cebete backup. */
export const BACKUP_APP = 'cebete'

/** The backup file as it is written: one JSON object holding every backed-up table. */
export type BackupFile = {
  readonly app: string
  /** The data version the rows are in. It is the database schema version at export time. */
  readonly version: number
  /** When the backup was made, as an ISO date and time. */
  readonly exportedAt: string
  readonly tables: Readonly<Record<string, readonly unknown[]>>
}

/** A backup that has been checked and brought up to date, ready to be restored. */
export type ParsedBackup = {
  /** The version the file declared, before any upgrade. */
  readonly version: number
  readonly exportedAt: string
  /** Rows per table, already in the current layout and all valid. */
  readonly tables: Readonly<Record<string, readonly unknown[]>>
  /** How many rows each table holds. */
  readonly counts: Readonly<Record<string, number>>
}

/** What making a backup produced. */
export type BackupResult = {
  readonly file: BackupFile
  /** How many rows of each table went into the backup. */
  readonly counts: Readonly<Record<string, number>>
  /** How many stored rows could not be read, and so were left out of the backup. */
  readonly skipped: number
}
