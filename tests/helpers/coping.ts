import { fireEvent, screen } from '@testing-library/react'

import { COPING_TYPE_LABELS, type NewCopingItem } from '@/coping/types'

/** A valid item of the given kind, with a text that tells the items apart. */
export function copingItem(
  type: NewCopingItem['type'] = 'do',
  text = 'Slow breathing',
  detail?: string,
): NewCopingItem {
  return detail === undefined ? { type, text } : { type, text, detail }
}

function field(label: string): HTMLInputElement | HTMLTextAreaElement {
  const found = screen.getByLabelText(label)

  if (!(found instanceof HTMLInputElement || found instanceof HTMLTextAreaElement)) {
    throw new Error(`The ${label} field is not a text field`)
  }

  return found
}

export function textField(): HTMLInputElement | HTMLTextAreaElement {
  return field('Short text')
}

export function detailField(): HTMLInputElement | HTMLTextAreaElement {
  return field('Detail (optional)')
}

/** Fills in the open coping form, the way a user would. Anything left out is not touched. */
export function fillForm(values: {
  type?: NewCopingItem['type']
  text?: string
  detail?: string
}): void {
  if (values.type !== undefined) {
    fireEvent.click(screen.getByRole('radio', { name: COPING_TYPE_LABELS[values.type] }))
  }
  if (values.text !== undefined) {
    fireEvent.change(textField(), { target: { value: values.text } })
  }
  if (values.detail !== undefined) {
    fireEvent.change(detailField(), { target: { value: values.detail } })
  }
}

export function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}
