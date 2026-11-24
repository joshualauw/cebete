import { db, SCHEMA_VERSION } from '@/db/db'

import { backupTables } from './registry'
import { BACKUP_APP, type BackupResult } from './types'

/**
 * Builds a backup of everything stored, by going through every registered table. Rows that
 * cannot be read as valid entries are left out and counted, so a backup can always be restored.
 * All tables are read in one transaction, so the backup is a consistent snapshot.
 */
export async function createBackup(): Promise<BackupResult> {
  const names = Object.keys(backupTables)
  const tables: Record<string, readonly unknown[]> = {}
  const counts: Record<string, number> = {}
  let skipped = 0

  await db.transaction(
    'r',
    names.map((name) => db.table(name)),
    async () => {
      for (const name of names) {
        const table = backupTables[name]
        const rows: readonly unknown[] = await db.table(name).toArray()
        const valid = rows.filter((row) => table?.isValidRow(row) === true)

        tables[name] = valid
        counts[name] = valid.length
        skipped += rows.length - valid.length
      }
    },
  )

  return {
    file: {
      app: BACKUP_APP,
      version: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      tables,
    },
    counts,
    skipped,
  }
}

/** The backup as the text of the file the user downloads. */
export function serializeBackup(result: BackupResult): string {
  return JSON.stringify(result.file, null, 2)
}
