import { SCHEMA_VERSION } from '@/db/db'

import { InvalidBackupError } from './errors'
import { backupTables } from './registry'
import { BACKUP_APP, type ParsedBackup } from './types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** True when two rows share an id, which would make restoring them fail part-way. */
function hasDuplicateIds(rows: readonly unknown[]): boolean {
  const seen = new Set<unknown>()

  for (const row of rows) {
    const id = isRecord(row) ? row.id : undefined

    if (id === undefined) {
      continue
    }
    if (seen.has(id)) {
      return true
    }
    seen.add(id)
  }

  return false
}

/**
 * Checks the text of a file before anything on the device is touched, without trusting it. A
 * file that is not a backup, is damaged, or comes from a newer version of the app is refused
 * with a reason. An older backup is brought up to date as it is read.
 */
export function parseBackup(text: string): ParsedBackup {
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    throw new InvalidBackupError('not-json')
  }

  if (!isRecord(data) || data.app !== BACKUP_APP) {
    throw new InvalidBackupError('not-backup')
  }

  const { version, exportedAt, tables } = data

  if (typeof version !== 'number' || !Number.isInteger(version)) {
    throw new InvalidBackupError('damaged')
  }
  if (version > SCHEMA_VERSION) {
    throw new InvalidBackupError('newer-version')
  }
  if (version < 1) {
    throw new InvalidBackupError('too-old')
  }
  if (typeof exportedAt !== 'string' || Number.isNaN(Date.parse(exportedAt)) || !isRecord(tables)) {
    throw new InvalidBackupError('damaged')
  }
  if (Object.keys(tables).some((name) => !(name in backupTables))) {
    throw new InvalidBackupError('damaged')
  }

  const upgraded: Record<string, readonly unknown[]> = {}
  const counts: Record<string, number> = {}

  for (const [name, table] of Object.entries(backupTables)) {
    const stored = tables[name]

    if (stored === undefined) {
      // A table that already existed when the backup was made must be there. Without this, a
      // damaged file could silently wipe a table when it is restored.
      if (version >= table.since) {
        throw new InvalidBackupError('damaged')
      }
      upgraded[name] = []
      counts[name] = 0
      continue
    }

    if (!Array.isArray(stored)) {
      throw new InvalidBackupError('damaged')
    }

    const rows = table.upgrade(stored, version)

    if (!rows.every((row) => table.isValidRow(row)) || hasDuplicateIds(rows)) {
      throw new InvalidBackupError('damaged')
    }

    upgraded[name] = rows
    counts[name] = rows.length
  }

  return { version, exportedAt, tables: upgraded, counts }
}
