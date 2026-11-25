import type { LastBackup } from './lastBackup'

const DAY_MS = 24 * 60 * 60 * 1000

/** A backup older than this makes the reminder due. */
export const OVERDUE_AFTER_DAYS = 14

/** How long "Not now" puts the reminder off. */
export const SNOOZE_DAYS = 7

export const SNOOZE_MS = SNOOZE_DAYS * DAY_MS

type ReminderFacts = {
  readonly lastBackup: LastBackup
  /** Until when the reminder was put off, or `null` when it was not. */
  readonly snoozedUntil: number | null
  /** Whether there is anything on the device worth backing up. */
  readonly hasData: boolean
  readonly now: number
}

/**
 * Whether the gentle backup reminder should be shown. It is due only when there is something to
 * lose and the last backup is missing or more than 14 days old, and not while it is put off. When
 * the browser cannot say whether a backup was made, it stays quiet rather than nag on every visit.
 */
export function isBackupDue({ lastBackup, snoozedUntil, hasData, now }: ReminderFacts): boolean {
  if (!hasData || lastBackup.status === 'unknown') {
    return false
  }

  if (snoozedUntil !== null && now < snoozedUntil) {
    return false
  }

  return lastBackup.status === 'never' || now - lastBackup.at > OVERDUE_AFTER_DAYS * DAY_MS
}
