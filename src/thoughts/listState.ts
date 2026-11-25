/**
 * What is carried in the history entry of the list: after a delete, that the user should be told,
 * and after opening a record, which one, so that coming back can return focus to its card.
 */
export type ThoughtsListState = {
  readonly deleted?: true
  readonly fromRecord?: number
}

export const afterDelete: ThoughtsListState = { deleted: true }

export function backFromRecord(id: number): ThoughtsListState {
  return { fromRecord: id }
}

export function isAfterDelete(state: unknown): boolean {
  return typeof state === 'object' && state !== null && 'deleted' in state && state.deleted === true
}

/** The record the user came back from, or `null` when they did not come back from one. */
export function recordLeftFrom(state: unknown): number | null {
  if (typeof state === 'object' && state !== null && 'fromRecord' in state) {
    return typeof state.fromRecord === 'number' ? state.fromRecord : null
  }

  return null
}
