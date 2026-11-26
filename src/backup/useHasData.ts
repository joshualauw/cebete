import { useLiveQuery } from 'dexie-react-hooks'

import { db } from '@/db/db'

async function countAnything(): Promise<boolean> {
  try {
    // The coping library is left out: it starts with a few items of its own, so a brand-new user
    // would look as if they had something to lose.
    const counts = await Promise.all([db.moodEntries.count(), db.thoughtRecords.count()])

    return counts.some((count) => count > 0)
  } catch (error) {
    // The live-query hook throws on failure, which would take the whole app down. A reminder is
    // not worth that, so a failed read simply means there is nothing to remind about.
    console.error('Could not check whether there is data to back up', error)
    return false
  }
}

/**
 * Whether the device holds any mood entry or thought record, kept up to date by
 * itself. It is `undefined` until the first read finishes, so nothing flashes by mistake.
 */
export function useHasData(): boolean | undefined {
  return useLiveQuery(countAnything, [])
}
