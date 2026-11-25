import { useLiveQuery } from 'dexie-react-hooks'

import { listThoughtRecords } from './repository'
import type { ThoughtRecord } from './types'

export type ThoughtRecordsState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly records: readonly ThoughtRecord[] }
  | { readonly status: 'error' }

async function loadRecords(): Promise<ThoughtRecordsState> {
  try {
    return { status: 'ready', records: await listThoughtRecords() }
  } catch (error) {
    // The live-query hook throws on failure, which would take the whole app down.
    console.error('Thought records could not be loaded', error)
    return { status: 'error' }
  }
}

/** The thought records, newest first, kept up to date whenever the stored data changes. */
export function useThoughtRecords(): ThoughtRecordsState {
  return useLiveQuery(loadRecords, []) ?? { status: 'loading' }
}
