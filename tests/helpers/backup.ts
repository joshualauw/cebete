import { SCHEMA_VERSION } from '@/db/db'

/** A saved entry in the current layout, as it appears in a backup. */
export function currentEntry(
  id: number,
  emotion = 'calm',
  intensity = 4,
  extra: object = {},
): object {
  return { id, emotions: [{ emotion, intensity }], createdAt: 1_700_000_000_000 + id, ...extra }
}

/** A saved entry in the old layout: one emotion rated 0 to 100. */
export function legacyEntry(
  id: number,
  emotion = 'calm',
  intensity = 40,
  extra: object = {},
): object {
  return { id, emotion, intensity, createdAt: 1_700_000_000_000 + id, ...extra }
}

/** The tables of a backup made by the current version, with no other rows unless given. */
export function currentTables(
  moodEntries: unknown,
  thoughtRecords: readonly unknown[] = [],
  copingItems: readonly unknown[] = [],
): Record<string, unknown> {
  return { moodEntries, thoughtRecords, copingItems }
}

/** The text of a backup file. Anything can be overridden, to build a file that is wrong. */
export function backupText(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    app: 'cebete',
    version: SCHEMA_VERSION,
    exportedAt: '2026-11-24T10:00:00.000Z',
    tables: currentTables([currentEntry(1), currentEntry(2, 'sad', 7)]),
    ...overrides,
  })
}
