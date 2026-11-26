/**
 * A request, carried in the navigation history entry, for a section to open with its entry form
 * already open, as when a quick action on Home sends the user there.
 */
export type OpenFormRequest = { readonly openForm: true }

export const openFormRequest: OpenFormRequest = { openForm: true }

/** Whether a history note asks for the form to be opened. Anything else is ignored. */
export function wantsOpenForm(state: unknown): boolean {
  return (
    typeof state === 'object' && state !== null && 'openForm' in state && state.openForm === true
  )
}
