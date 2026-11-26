import { useMoodEntries } from '@/mood/useMoodEntries'
import type { MoodEntry } from '@/mood/types'
import { useThoughtRecords } from '@/thoughts/useThoughtRecords'
import type { ThoughtRecord } from '@/thoughts/types'

export type SummaryDataState =
  | { readonly status: 'loading' }
  | {
      readonly status: 'ready'
      readonly entries: readonly MoodEntry[]
      readonly records: readonly ThoughtRecord[]
    }
  | { readonly status: 'error' }

/**
 * The mood entries and thought records a summary is made from, kept up to date by itself
 * whenever the stored data changes. It is `loading` until both have been read, so nothing is
 * shown too early, and `error` if either cannot be read.
 */
export function useSummaryData(): SummaryDataState {
  const moods = useMoodEntries()
  const thoughts = useThoughtRecords()

  if (moods.status === 'error' || thoughts.status === 'error') {
    return { status: 'error' }
  }

  if (moods.status === 'loading' || thoughts.status === 'loading') {
    return { status: 'loading' }
  }

  return { status: 'ready', entries: moods.entries, records: thoughts.records }
}
