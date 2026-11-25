import { db } from '@/db/db'

import { reconcileChallenge, sameEmotions } from './challenge'
import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from './errors'
import type {
  NewThoughtRecordInput,
  ThoughtChallenge,
  ThoughtRecord,
  ThoughtRecordChanges,
} from './types'
import {
  isThoughtRecord,
  validateChallenge,
  validateNewThoughtRecord,
  validateThoughtRecordChanges,
  validateThoughtRecordTime,
} from './validation'

/**
 * Saves a new thought record and returns it as stored. Nothing is saved if it breaks a rule.
 * Without a given time it is stamped with the moment it is saved.
 */
export async function addThoughtRecord(input: NewThoughtRecordInput): Promise<ThoughtRecord> {
  const record = validateNewThoughtRecord(input)
  const createdAt =
    input.createdAt === undefined ? Date.now() : validateThoughtRecordTime(input.createdAt)
  const id = await db.thoughtRecords.add({ ...record, createdAt })

  return { ...record, id, createdAt }
}

/**
 * Replaces a saved record with an edited one, keeping its id. A record that is gone is never
 * recreated, and an answer that was cleared is removed from the stored record. A challenge
 * the record already has is kept, with its feelings following the edited ones.
 */
export async function updateThoughtRecord(
  id: number,
  changes: ThoughtRecordChanges,
): Promise<ThoughtRecord> {
  const record = validateThoughtRecordChanges(changes)

  return db.transaction('rw', db.thoughtRecords, async () => {
    const existing = await db.thoughtRecords.get(id)

    if (existing === undefined) {
      throw new ThoughtRecordNotFoundError()
    }

    const updated: ThoughtRecord = {
      ...record,
      id,
      ...(existing.challenge && {
        challenge: reconcileChallenge(existing.challenge, record.emotions),
      }),
    }

    await db.thoughtRecords.put(updated)

    return updated
  })
}

/**
 * Saves the challenge of a record, whether it is the first one or a revision, and changes
 * nothing else in the record. The re-rated feelings must be exactly the record's own emotions.
 * A record that is gone is never recreated.
 */
export async function saveThoughtChallenge(
  id: number,
  challenge: ThoughtChallenge,
): Promise<ThoughtRecord> {
  const checked = validateChallenge(challenge)

  return db.transaction('rw', db.thoughtRecords, async () => {
    const existing = await db.thoughtRecords.get(id)

    if (existing === undefined) {
      throw new ThoughtRecordNotFoundError()
    }

    if (!sameEmotions(existing.emotions, checked.emotions)) {
      throw new InvalidThoughtRecordError(
        'emotions',
        'The feelings must be the same as in the record.',
      )
    }

    const updated: ThoughtRecord = { ...existing, challenge: checked }

    await db.thoughtRecords.put(updated)

    return updated
  })
}

let lastReportedUnreadable = 0

function reportUnreadable(count: number): void {
  if (count === lastReportedUnreadable) {
    return
  }

  lastReportedUnreadable = count

  if (count > 0) {
    const one = count === 1
    console.warn(
      `${String(count)} saved thought ${one ? 'record' : 'records'} could not be read and ${one ? 'is' : 'are'} not shown`,
    )
  }
}

/**
 * Lists every thought record, newest first, with records of the same time in save order. A row
 * that cannot be read as a record is left out, not deleted, and reported once.
 */
export async function listThoughtRecords(): Promise<ThoughtRecord[]> {
  const rows: readonly unknown[] = await db.thoughtRecords.toArray()
  const records = rows.filter(isThoughtRecord)

  reportUnreadable(rows.length - records.length)

  return records.sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
}

/** Deletes one thought record. It cannot be undone. Deleting a record that is gone does nothing. */
export async function deleteThoughtRecord(id: number): Promise<void> {
  await db.thoughtRecords.delete(id)
}
