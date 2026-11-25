const LAST_BACKUP_KEY = 'cebete.lastBackupAt'
const SNOOZE_KEY = 'cebete.backupReminderSnoozedUntil'

/** When the user last made a backup, as far as this browser knows. */
export type LastBackup =
  | { readonly status: 'unknown' }
  | { readonly status: 'never' }
  | { readonly status: 'made'; readonly at: number }

/** A plain value, so a screen can compare it between renders: a time, `never`, or `unknown`. */
export type LastBackupSnapshot = number | 'never' | 'unknown'

type Stored =
  { readonly readable: true; readonly value: number | null } | { readonly readable: false }

const listeners = new Set<() => void>()

function notify(): void {
  for (const listener of listeners) {
    listener()
  }
}

/** Browser storage can be missing or blocked, and holds whatever was written, so it is checked. */
function read(key: string): Stored {
  try {
    const raw = localStorage.getItem(key)

    if (raw === null) {
      return { readable: true, value: null }
    }

    const value = Number(raw)

    return { readable: true, value: Number.isSafeInteger(value) && value > 0 ? value : null }
  } catch {
    return { readable: false }
  }
}

function write(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Without storage the app still works; it just cannot remember.
  }
  notify()
}

export function readLastBackup(): LastBackupSnapshot {
  const stored = read(LAST_BACKUP_KEY)

  if (!stored.readable) {
    return 'unknown'
  }

  return stored.value ?? 'never'
}

export function toLastBackup(snapshot: LastBackupSnapshot): LastBackup {
  if (snapshot === 'unknown' || snapshot === 'never') {
    return { status: snapshot }
  }

  return { status: 'made', at: snapshot }
}

/** Remembers that a backup was just made. A restore is not a backup and must not call this. */
export function recordBackup(at: number = Date.now()): void {
  write(LAST_BACKUP_KEY, at)
}

/** Until when the reminder was put off with "Not now", or `null` when it was not. */
export function readSnoozedUntil(): number | null {
  const stored = read(SNOOZE_KEY)

  return stored.readable ? stored.value : null
}

export function snoozeBackupReminder(until: number): void {
  write(SNOOZE_KEY, until)
}

/** Calls `listener` when either value changes, here or in another tab. */
export function subscribeBackupPrefs(listener: () => void): () => void {
  listeners.add(listener)
  window.addEventListener('storage', listener)

  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}
