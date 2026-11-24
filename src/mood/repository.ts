import { db } from '@/db/db'

import { MoodEntryNotFoundError } from './errors'
import type { MoodEntry, MoodEntryChanges, NewMoodEntryInput } from './types'
import {
  isMoodEntry,
  validateMoodEntryChanges,
  validateNewMoodEntry,
  validateRecordedTime,
} from './validation'

/**
 * Saves a new mood entry and returns it as stored. The entry is checked first, and nothing is
 * saved if it breaks a rule. It is stamped with the moment it is saved, unless the caller gives
 * the time the feeling happened, which must be a real moment that is not in the future.
 */
export async function addMoodEntry(input: NewMoodEntryInput): Promise<MoodEntry> {
  const entry = validateNewMoodEntry(input)
  const createdAt =
    input.createdAt === undefined ? Date.now() : validateRecordedTime(input.createdAt)
  const id = await db.moodEntries.add({ ...entry, createdAt })

  return { ...entry, id, createdAt }
}

/**
 * Replaces a saved entry with an edited one, keeping its id. The edit is checked first, and
 * nothing is saved if it breaks a rule. An entry that is gone is never recreated. A note that
 * was cleared is removed from the stored entry.
 */
export async function updateMoodEntry(id: number, changes: MoodEntryChanges): Promise<MoodEntry> {
  const entry = validateMoodEntryChanges(changes)

  return db.transaction('rw', db.moodEntries, async () => {
    if ((await db.moodEntries.get(id)) === undefined) {
      throw new MoodEntryNotFoundError()
    }

    const updated: MoodEntry = { ...entry, id }

    await db.moodEntries.put(updated)

    return updated
  })
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
