import { useLiveQuery } from 'dexie-react-hooks'

import { getThoughtRecord } from './repository'
import type { ThoughtRecord } from './types'

export type ThoughtRecordState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly record: ThoughtRecord }
  | { readonly status: 'missing' }
  | { readonly status: 'error' }

type LoadedRecord = {
  readonly id: number
  readonly state: Exclude<ThoughtRecordState, { readonly status: 'loading' }>
}

async function loadRecord(id: number): Promise<LoadedRecord> {
  try {
    const record = await getThoughtRecord(id)

    return { id, state: record ? { status: 'ready', record } : { status: 'missing' } }
  } catch (error) {
    // The live-query hook throws on failure, which would take the whole app down.
    console.error('The thought record could not be loaded', error)
    return { id, state: { status: 'error' } }
  }
}

/** One thought record, kept up to date whenever the stored data changes. */
export function useThoughtRecord(id: number): ThoughtRecordState {
  const loaded = useLiveQuery(() => loadRecord(id), [id])

  // After the id changes, the hook may still hold the previous record for a moment.
  return loaded?.id === id ? loaded.state : { status: 'loading' }
}
