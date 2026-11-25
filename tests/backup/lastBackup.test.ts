import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  readLastBackup,
  readSnoozedUntil,
  recordBackup,
  snoozeBackupReminder,
  subscribeBackupPrefs,
  toLastBackup,
} from '@/backup/lastBackup'

const LAST_BACKUP_KEY = 'cebete.lastBackupAt'
const SNOOZE_KEY = 'cebete.backupReminderSnoozedUntil'
const SOME_TIME = 1_700_000_000_000

afterEach(() => {
  vi.restoreAllMocks()
})

function blockReading(): void {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('storage blocked')
  })
}

function blockWriting(): void {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('storage blocked')
  })
}

describe('the last backup', () => {
  it('is "never" when nothing was recorded', () => {
    expect(readLastBackup()).toBe('never')
    expect(toLastBackup(readLastBackup())).toEqual({ status: 'never' })
  })

  it('remembers the time a backup was recorded', () => {
    recordBackup(SOME_TIME)

    expect(readLastBackup()).toBe(SOME_TIME)
    expect(toLastBackup(readLastBackup())).toEqual({ status: 'made', at: SOME_TIME })
  })

  it('records the current moment when no time is given', () => {
    vi.spyOn(Date, 'now').mockReturnValue(SOME_TIME)

    recordBackup()

    expect(readLastBackup()).toBe(SOME_TIME)
  })

  it.each(['abc', '', '0', '-5', '1.5', 'NaN', '1e400', '  '])(
    'treats the stored value %j as never, not as a time',
    (value) => {
      localStorage.setItem(LAST_BACKUP_KEY, value)

      expect(readLastBackup()).toBe('never')
    },
  )

  it('is "unknown" when the browser blocks its storage, so it cannot be mistaken for never', () => {
    blockReading()

    expect(readLastBackup()).toBe('unknown')
    expect(toLastBackup(readLastBackup())).toEqual({ status: 'unknown' })
  })

  it('does not break the app when the time cannot be written', () => {
    blockWriting()

    expect(() => {
      recordBackup(SOME_TIME)
    }).not.toThrow()
    expect(readLastBackup()).toBe('never')
  })
})

describe('putting the reminder off', () => {
  it('has no snooze at first', () => {
    expect(readSnoozedUntil()).toBeNull()
  })

  it('remembers until when it was put off', () => {
    snoozeBackupReminder(SOME_TIME)

    expect(readSnoozedUntil()).toBe(SOME_TIME)
  })

  it.each(['abc', '', '0', '-1', '2.5'])('ignores the stored value %j', (value) => {
    localStorage.setItem(SNOOZE_KEY, value)

    expect(readSnoozedUntil()).toBeNull()
  })

  it('reports no snooze, and does not throw, when storage is blocked', () => {
    blockReading()
    blockWriting()

    expect(readSnoozedUntil()).toBeNull()
    expect(() => {
      snoozeBackupReminder(SOME_TIME)
    }).not.toThrow()
  })

  it('does not touch the time of the last backup', () => {
    recordBackup(SOME_TIME)

    snoozeBackupReminder(SOME_TIME + 1)

    expect(readLastBackup()).toBe(SOME_TIME)
  })
})

describe('following changes', () => {
  it('tells a listener when a backup is recorded or the reminder is put off', () => {
    const listener = vi.fn()
    const stop = subscribeBackupPrefs(listener)

    recordBackup(SOME_TIME)
    snoozeBackupReminder(SOME_TIME)

    expect(listener).toHaveBeenCalledTimes(2)
    stop()
  })

  it('stops telling a listener once it unsubscribes', () => {
    const listener = vi.fn()

    subscribeBackupPrefs(listener)()
    recordBackup(SOME_TIME)

    expect(listener).not.toHaveBeenCalled()
  })

  it('hears about a change made in another tab', () => {
    const listener = vi.fn()
    const stop = subscribeBackupPrefs(listener)

    window.dispatchEvent(new StorageEvent('storage', { key: LAST_BACKUP_KEY }))

    expect(listener).toHaveBeenCalledTimes(1)
    stop()
  })
})
