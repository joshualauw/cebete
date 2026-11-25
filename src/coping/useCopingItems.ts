import { useLiveQuery } from 'dexie-react-hooks'

import { listCopingItems } from './repository'
import type { CopingItem } from './types'

export type CopingItemsState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly items: readonly CopingItem[] }
  | { readonly status: 'error' }

async function loadItems(): Promise<CopingItemsState> {
  try {
    return { status: 'ready', items: await listCopingItems() }
  } catch (error) {
    // The live-query hook throws on failure, which would take the whole app down.
    // Reporting it as a state lets the screen show a calm message instead.
    console.error('Coping items could not be loaded', error)
    return { status: 'error' }
  }
}

/**
 * The coping items, grouped by kind, kept up to date by itself whenever the stored data changes.
 * It reports `loading` until the first read finishes, so an empty list is never shown too early.
 */
export function useCopingItems(): CopingItemsState {
  return useLiveQuery(loadItems, []) ?? { status: 'loading' }
}
