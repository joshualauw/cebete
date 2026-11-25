import { db } from '@/db/db'

import type { BodyNote } from './body'
import { reconcileChallenge, sameEmotions } from './challenge'
import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from './errors'
import type {
  NewThoughtRecordInput,
  ThoughtChallenge,
  ThoughtRecord,
  ThoughtRecordChanges,
  ThoughtTest,
} from './types'
import {
  isThoughtRecord,
  validateChallenge,
  validateBody,
  validateNewThoughtRecord,
  validateTest,
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
      ...(existing.test && { test: existing.test }),
      ...(existing.body && { body: existing.body }),
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

    // Every save is the latest version of the challenge, so it is dated now.
    const updated: ThoughtRecord = {
      ...existing,
      challenge: { ...checked, challengedAt: Date.now() },
    }

    await db.thoughtRecords.put(updated)

    return updated
  })
}

/**
 * Dates a test as it is saved. A planned test has no date. A result is dated now when it is
 * logged for the first time or when its result or belief changes. Changing only the plan of a
 * logged test keeps the date of its result, since the result did not change.
 */
function dateTest(checked: ThoughtTest, previous: ThoughtTest | undefined): ThoughtTest {
  if (checked.status === 'planned') {
    return checked
  }

  const { status, plan, prediction, result, belief } = checked

  if (previous?.status === 'done' && previous.result === result && previous.belief === belief) {
    return {
      status,
      plan,
      prediction,
      result,
      belief,
      ...(previous.testedAt !== undefined && { testedAt: previous.testedAt }),
    }
  }

  return { status, plan, prediction, result, belief, testedAt: Date.now() }
}

/**
 * Saves the test of a record, whether it is the first plan, a revised plan, the result or a
 * revised result, and changes nothing else in the record. A record that is gone is never
 * recreated.
 */
export async function saveThoughtTest(id: number, test: ThoughtTest): Promise<ThoughtRecord> {
  const checked = validateTest(test)

  return db.transaction('rw', db.thoughtRecords, async () => {
    const existing = await db.thoughtRecords.get(id)

    if (existing === undefined) {
      throw new ThoughtRecordNotFoundError()
    }

    const updated: ThoughtRecord = { ...existing, test: dateTest(checked, existing.test) }

    await db.thoughtRecords.put(updated)

    return updated
  })
}

/**
 * Drops a test that is only planned, so the record is as if it had never been planned. A test
 * whose result is logged cannot be removed, only revised. A record that is gone is never
 * recreated.
 */
export async function removeThoughtPlan(id: number): Promise<void> {
  await db.transaction('rw', db.thoughtRecords, async () => {
    const existing = await db.thoughtRecords.get(id)

    if (existing === undefined) {
      throw new ThoughtRecordNotFoundError()
    }

    if (existing.test?.status === 'done') {
      throw new InvalidThoughtRecordError('record', 'A test with a result cannot be removed.')
    }

    // Dexie deletes a property that is updated to undefined.
    await db.thoughtRecords.update(id, { test: undefined })
  })
}

/**
 * Saves the body notes of a record, replacing the ones it has, and changes nothing else in it.
 * An empty list removes them, so a record with no notes has no body property at all. A record
 * that is gone is never recreated.
 */
export async function saveThoughtBody(id: number, notes: readonly BodyNote[]): Promise<void> {
  const checked = validateBody(notes)

  await db.transaction('rw', db.thoughtRecords, async () => {
    const existing = await db.thoughtRecords.get(id)

    if (existing === undefined) {
      throw new ThoughtRecordNotFoundError()
    }

    if (checked.length === 0) {
      // Dexie deletes a property that is updated to undefined.
      await db.thoughtRecords.update(id, { body: undefined })
    } else {
      await db.thoughtRecords.put({ ...existing, body: checked })
    }
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

const reportedUnreadableIds = new Set<number>()

/**
 * Reads one thought record, or `undefined` when there is none with that id. A row that cannot be
 * read as a record counts as missing, is left in place, and is reported once per page load.
 */
export async function getThoughtRecord(id: number): Promise<ThoughtRecord | undefined> {
  const row: unknown = await db.thoughtRecords.get(id)

  if (row === undefined) {
    return undefined
  }

  if (!isThoughtRecord(row)) {
    if (!reportedUnreadableIds.has(id)) {
      reportedUnreadableIds.add(id)
      console.warn('A saved thought record could not be read and is not shown')
    }

    return undefined
  }

  return row
}

/** Deletes one thought record. It cannot be undone. Deleting a record that is gone does nothing. */
export async function deleteThoughtRecord(id: number): Promise<void> {
  await db.thoughtRecords.delete(id)
}
