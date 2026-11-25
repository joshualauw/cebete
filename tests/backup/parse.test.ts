import { describe, expect, it } from 'vitest'

import { InvalidBackupError, type InvalidBackupReason } from '@/backup/errors'
import { parseBackup } from '@/backup/parse'
import { SCHEMA_VERSION } from '@/db/db'
import { backupText, currentTables, currentEntry, legacyEntry } from '@tests/helpers/backup'

/** Parses text and reports why it was refused, or undefined if it was accepted. */
function refusal(text: string): InvalidBackupReason | undefined {
  try {
    parseBackup(text)
  } catch (error) {
    if (error instanceof InvalidBackupError) {
      return error.reason
    }
    throw error
  }

  return undefined
}

describe('parseBackup: a valid backup', () => {
  it('is accepted, with its rows, count, date and version', () => {
    const backup = parseBackup(backupText())

    expect(backup.version).toBe(SCHEMA_VERSION)
    expect(backup.exportedAt).toBe('2026-11-24T10:00:00.000Z')
    expect(backup.counts).toEqual({ moodEntries: 2, thoughtRecords: 0, copingItems: 0 })
    expect(backup.tables.moodEntries).toEqual([currentEntry(1), currentEntry(2, 'sad', 7)])
  })

  it('may hold no entries at all', () => {
    const backup = parseBackup(backupText({ tables: currentTables([]) }))

    expect(backup.counts).toEqual({ moodEntries: 0, thoughtRecords: 0, copingItems: 0 })
  })

  it('may hold entries with a note, and with several emotions', () => {
    const rows = [
      currentEntry(1, 'calm', 4, { note: 'a quiet morning' }),
      {
        id: 2,
        createdAt: 5,
        emotions: [
          { emotion: 'sad', intensity: 2 },
          { emotion: 'hopeful', intensity: 6 },
        ],
      },
    ]

    expect(refusal(backupText({ tables: currentTables(rows) }))).toBeUndefined()
  })
})

describe('parseBackup: files that are not backups', () => {
  it.each(['', 'not json at all', '{', '{"app":', 'cebete'])(
    'refuses the text %j as not JSON',
    (text) => {
      expect(refusal(text)).toBe('not-json')
    },
  )

  it.each(['null', '[]', '5', '"cebete"', 'true', '{}', '{"version":3}'])(
    'refuses the JSON %s as not a cebete backup',
    (text) => {
      expect(refusal(text)).toBe('not-backup')
    },
  )

  it('refuses a file with a different app marker', () => {
    expect(refusal(backupText({ app: 'another-app' }))).toBe('not-backup')
  })
})

describe('parseBackup: versions', () => {
  it.each([SCHEMA_VERSION + 1, SCHEMA_VERSION + 50])('refuses the newer version %i', (version) => {
    expect(refusal(backupText({ version }))).toBe('newer-version')
  })

  it.each([0, -1])('refuses the too-old version %i', (version) => {
    expect(refusal(backupText({ version }))).toBe('too-old')
  })

  it.each([undefined, 3.5, '3', null, Number.NaN])(
    'refuses the version %j as damaged',
    (version) => {
      expect(refusal(backupText({ version }))).toBe('damaged')
    },
  )

  it('upgrades a version 2 backup, converting entries from the old single-emotion layout', () => {
    const text = backupText({
      version: 2,
      tables: {
        moodEntries: [
          legacyEntry(1, 'sad', 4, { note: 'low' }),
          legacyEntry(2, 'happy', 92),
          legacyEntry(3, 'grateful', 100),
        ],
      },
    })

    const backup = parseBackup(text)

    expect(backup.version).toBe(2)
    expect(backup.tables.moodEntries).toEqual([
      {
        id: 1,
        createdAt: 1_700_000_000_001,
        note: 'low',
        emotions: [{ emotion: 'sad', intensity: 0 }],
      },
      { id: 2, createdAt: 1_700_000_000_002, emotions: [{ emotion: 'happy', intensity: 9 }] },
      { id: 3, createdAt: 1_700_000_000_003, emotions: [{ emotion: 'grateful', intensity: 10 }] },
    ])
  })

  it('refuses a version 2 backup that holds a damaged old entry', () => {
    const text = backupText({
      version: 2,
      tables: { moodEntries: [legacyEntry(1), { id: 2, intensity: 40, createdAt: 5 }] },
    })

    expect(refusal(text)).toBe('damaged')
  })

  it('accepts a version 1 backup, which holds no data', () => {
    const backup = parseBackup(backupText({ version: 1, tables: {} }))

    expect(backup.counts).toEqual({ moodEntries: 0, thoughtRecords: 0, copingItems: 0 })
    expect(backup.tables.moodEntries).toEqual([])
  })
})

describe('parseBackup: damaged backups', () => {
  it.each([undefined, 'yesterday', 5, null])('refuses the date %j', (exportedAt) => {
    expect(refusal(backupText({ exportedAt }))).toBe('damaged')
  })

  it.each([undefined, null, [], 'tables', 5])('refuses %j in place of the tables', (tables) => {
    expect(refusal(backupText({ tables }))).toBe('damaged')
  })

  it('refuses a table it does not know', () => {
    expect(refusal(backupText({ tables: { ...currentTables([]), secrets: [] } }))).toBe('damaged')
  })

  it('refuses a table that is not a list of rows', () => {
    expect(refusal(backupText({ tables: currentTables({ 1: currentEntry(1) }) }))).toBe('damaged')
  })

  it('refuses a current backup that is missing a table, so it cannot silently wipe one', () => {
    expect(refusal(backupText({ tables: {} }))).toBe('damaged')
  })

  it.each([
    ['not an object', 'calm'],
    ['without an id', { emotions: [{ emotion: 'calm', intensity: 4 }], createdAt: 1 }],
    ['without a time', { id: 1, emotions: [{ emotion: 'calm', intensity: 4 }] }],
    ['with no emotions', { id: 1, emotions: [], createdAt: 1 }],
    [
      'with an unknown emotion',
      { id: 1, emotions: [{ emotion: 'bogus', intensity: 4 }], createdAt: 1 },
    ],
    [
      'with a rating out of range',
      { id: 1, emotions: [{ emotion: 'calm', intensity: 40 }], createdAt: 1 },
    ],
    ['in the old layout', legacyEntry(1)],
  ])('refuses a current backup with a row that is %s', (_label, row) => {
    expect(refusal(backupText({ tables: currentTables([currentEntry(9), row]) }))).toBe('damaged')
  })

  it('refuses a backup whose rows share an id, which could not be restored', () => {
    const rows = [currentEntry(1), currentEntry(1, 'sad', 7)]

    expect(refusal(backupText({ tables: currentTables(rows) }))).toBe('damaged')
  })
})

describe('InvalidBackupError', () => {
  it.each<[InvalidBackupReason, RegExp]>([
    ['not-json', /not a cebete backup/],
    ['not-backup', /not a cebete backup/],
    ['newer-version', /newer version of cebete/],
    ['too-old', /too old/],
    ['damaged', /damaged/],
  ])('explains %s in plain words', (reason, wording) => {
    expect(new InvalidBackupError(reason).message).toMatch(wording)
  })
})
