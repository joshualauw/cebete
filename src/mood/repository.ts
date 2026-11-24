import { db } from '@/db/db'

import type { MoodEntry, NewMoodEntry } from './types'
import { isMoodEntry, validateNewMoodEntry } from './validation'

/**
 * Saves a new mood entry and returns it as stored. The entry is checked first, and nothing is
 * saved if it breaks a rule. The time is set here, so callers can never choose or fake it.
 */
export async function addMoodEntry(input: NewMoodEntry): Promise<MoodEntry> {
  const entry = validateNewMoodEntry(input)
  const createdAt = Date.now()
  const id = await db.moodEntries.add({ ...entry, createdAt })

  return { ...entry, id, createdAt }
}

/** How many unreadable rows were last reported, so the same problem is not repeated on every refresh. */
let lastReportedUnreadable = 0

function reportUnreadable(count: number): void {
  if (count === lastReportedUnreadable) {
    return
  }

  lastReportedUnreadable = count

  if (count > 0) {
    const one = count === 1
    console.warn(
      `${String(count)} saved mood ${one ? 'entry' : 'entries'} could not be read and ${one ? 'is' : 'are'} not shown`,
    )
  }
}

/**
 * Lists every mood entry, newest first. Entries saved in the same instant keep save order.
 * A row that cannot be read as an entry, such as a damaged one, is left out of the list so it
 * can never break it. It is not deleted, and it is reported once, not on every refresh.
 */
export async function listMoodEntries(): Promise<MoodEntry[]> {
  const rows: readonly unknown[] = await db.moodEntries.toArray()
  const entries = rows.filter(isMoodEntry)

  reportUnreadable(rows.length - entries.length)

  return entries.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
}

/** Deletes one mood entry. It cannot be undone. Deleting an entry that is gone does nothing. */
export async function deleteMoodEntry(id: number): Promise<void> {
  await db.moodEntries.delete(id)
}
