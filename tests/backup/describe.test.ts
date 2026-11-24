import { describe, expect, it } from 'vitest'

import {
  describeCounts,
  describeExport,
  describeRestore,
  formatBackupDate,
  totalCount,
} from '@/backup/describe'

describe('totalCount', () => {
  it('adds up the rows of every table', () => {
    expect(totalCount({ moodEntries: 3 })).toBe(3)
    expect(totalCount({})).toBe(0)
  })
})

describe('describeCounts', () => {
  it.each([
    [0, ''],
    [1, '1 mood entry'],
    [2, '2 mood entries'],
    [12, '12 mood entries'],
  ])('says %i entries as %j', (count, expected) => {
    expect(describeCounts({ moodEntries: count })).toBe(expected)
  })

  it('ignores a table it does not know', () => {
    expect(describeCounts({ somethingElse: 4, moodEntries: 2 })).toBe('2 mood entries')
  })
})

describe('describeExport', () => {
  it('says how much was saved', () => {
    expect(describeExport({ moodEntries: 3 }, 0)).toBe('Backup saved with 3 mood entries.')
  })

  it('uses the singular for one entry', () => {
    expect(describeExport({ moodEntries: 1 }, 0)).toBe('Backup saved with 1 mood entry.')
  })

  it('says so when there was nothing to back up', () => {
    expect(describeExport({ moodEntries: 0 }, 0)).toBe(
      'Backup saved. There was nothing to back up yet.',
    )
  })

  it('says when one entry could not be read and was left out', () => {
    expect(describeExport({ moodEntries: 3 }, 1)).toBe(
      'Backup saved with 3 mood entries. 1 entry could not be read, so it was left out.',
    )
  })

  it('says when several entries could not be read', () => {
    expect(describeExport({ moodEntries: 3 }, 2)).toBe(
      'Backup saved with 3 mood entries. 2 entries could not be read, so they were left out.',
    )
  })
})

describe('describeRestore', () => {
  it('says how much was restored', () => {
    expect(describeRestore({ moodEntries: 3 })).toBe('Your data was restored with 3 mood entries.')
    expect(describeRestore({ moodEntries: 1 })).toBe('Your data was restored with 1 mood entry.')
  })

  it('says so when the backup held nothing, so the device is now empty', () => {
    expect(describeRestore({ moodEntries: 0 })).toBe(
      'Your data was restored. The backup held no entries, so nothing is stored on this device now.',
    )
  })
})

describe('formatBackupDate', () => {
  it('shows the date and the time of day', () => {
    const text = formatBackupDate(new Date(2026, 10, 24, 15, 5).toISOString())

    expect(text).toContain('24')
    expect(text).toContain('2026')
    expect(text).toMatch(/3:05|15[:.]05/)
  })
})
