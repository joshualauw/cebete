import { describe, expect, it } from 'vitest'

import type { LastBackup } from '@/backup/lastBackup'
import { isBackupDue, OVERDUE_AFTER_DAYS, SNOOZE_DAYS, SNOOZE_MS } from '@/backup/reminder'

const DAY = 24 * 60 * 60 * 1000
const NOW = 1_800_000_000_000

function due(
  lastBackup: LastBackup,
  options: { snoozedUntil?: number | null; hasData?: boolean } = {},
): boolean {
  return isBackupDue({
    lastBackup,
    snoozedUntil: options.snoozedUntil ?? null,
    hasData: options.hasData ?? true,
    now: NOW,
  })
}

function madeDaysAgo(days: number, extraMs = 0): LastBackup {
  return { status: 'made', at: NOW - days * DAY - extraMs }
}

describe('isBackupDue', () => {
  it('uses 14 days for overdue and 7 days for putting it off', () => {
    expect(OVERDUE_AFTER_DAYS).toBe(14)
    expect(SNOOZE_DAYS).toBe(7)
    expect(SNOOZE_MS).toBe(7 * DAY)
  })

  it('is due when there is data and no backup was ever made', () => {
    expect(due({ status: 'never' })).toBe(true)
  })

  it('is not due when there is nothing to lose, so a new user is not nagged', () => {
    expect(due({ status: 'never' }, { hasData: false })).toBe(false)
    expect(due(madeDaysAgo(60), { hasData: false })).toBe(false)
  })

  it('is not due after a recent backup', () => {
    expect(due(madeDaysAgo(0))).toBe(false)
    expect(due(madeDaysAgo(13))).toBe(false)
  })

  it('is not due at exactly 14 days, and due as soon as it is more', () => {
    expect(due(madeDaysAgo(14))).toBe(false)
    expect(due(madeDaysAgo(14, 1))).toBe(true)
    expect(due(madeDaysAgo(30))).toBe(true)
  })

  it('stays quiet when the browser cannot say whether a backup was made', () => {
    expect(due({ status: 'unknown' })).toBe(false)
  })

  it('is not due while it is put off, and due again once that has passed', () => {
    expect(due({ status: 'never' }, { snoozedUntil: NOW + 1 })).toBe(false)
    expect(due({ status: 'never' }, { snoozedUntil: NOW })).toBe(true)
    expect(due({ status: 'never' }, { snoozedUntil: NOW - DAY })).toBe(true)
  })

  it('puts nothing off when a backup is recent anyway', () => {
    expect(due(madeDaysAgo(1), { snoozedUntil: NOW + DAY })).toBe(false)
  })
})
