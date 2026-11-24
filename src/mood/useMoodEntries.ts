import { useLiveQuery } from 'dexie-react-hooks'

import { listMoodEntries } from './repository'
import type { MoodEntry } from './types'

export type MoodEntriesState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly entries: readonly MoodEntry[] }
  | { readonly status: 'error' }

async function loadEntries(): Promise<MoodEntriesState> {
  try {
    return { status: 'ready', entries: await listMoodEntries() }
  } catch (error) {
    // The live-query hook throws on failure, which would take the whole app down.
    // Reporting it as a state lets the screen show a calm message instead.
    console.error('Mood entries could not be loaded', error)
    return { status: 'error' }
  }
}

/**
 * The mood entries, newest first, kept up to date by itself whenever the stored data changes.
 * It reports `loading` until the first read finishes, so an empty list is never shown too early.
 */
export function useMoodEntries(): MoodEntriesState {
  return useLiveQuery(loadEntries, []) ?? { status: 'loading' }
}
