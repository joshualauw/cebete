import { db } from '@/db/db'

import { backupTables } from './registry'
import type { ParsedBackup } from './types'

/**
 * Replaces everything stored with the contents of a backup, in one all-or-nothing step: every
 * registered table is cleared and refilled, ids included, inside a single transaction. If any
 * part fails, the transaction is rolled back and the previous data is exactly as it was.
 */
export async function restoreBackup(backup: ParsedBackup): Promise<void> {
  const names = Object.keys(backupTables)

  await db.transaction(
    'rw',
    names.map((name) => db.table(name)),
    async () => {
      for (const name of names) {
        const table = db.table(name)

        await table.clear()
        await table.bulkAdd([...(backup.tables[name] ?? [])])
      }
    },
  )
}
