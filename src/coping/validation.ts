import {
  COPING_TYPES,
  type CopingItem,
  type CopingType,
  DETAIL_MAX_LENGTH,
  type NewCopingItem,
  TEXT_MAX_LENGTH,
} from './types'

export type InvalidCopingItemField = 'item' | 'type' | 'text' | 'detail'

/** Thrown when an item breaks a rule. Nothing is saved when this happens. */
export class InvalidCopingItemError extends Error {
  readonly field: InvalidCopingItemField

  constructor(field: InvalidCopingItemField, message: string) {
    super(message)
    this.name = 'InvalidCopingItemError'
    this.field = field
  }
}

export function isCopingType(value: unknown): value is CopingType {
  return COPING_TYPES.some((type) => type === value)
}

/**
 * Checks an item against the rules and returns a clean copy of it. It accepts `unknown` because
 * items can come from a form or a backup, and it builds the result from the checked fields only.
 */
export function validateNewCopingItem(input: unknown): NewCopingItem {
  if (typeof input !== 'object' || input === null) {
    throw new InvalidCopingItemError('item', 'A coping item must be an object.')
  }

  const type = 'type' in input ? input.type : undefined
  const text = 'text' in input ? input.text : undefined
  const detail = 'detail' in input ? input.detail : undefined

  if (!isCopingType(type)) {
    throw new InvalidCopingItemError('type', 'Choose what kind of item this is.')
  }

  if (typeof text !== 'string') {
    throw new InvalidCopingItemError('text', 'Write a short text for the item.')
  }

  const trimmedText = text.trim()

  if (trimmedText === '') {
    throw new InvalidCopingItemError('text', 'Write a short text for the item.')
  }

  if (trimmedText.length > TEXT_MAX_LENGTH) {
    throw new InvalidCopingItemError(
      'text',
      `The text can be at most ${String(TEXT_MAX_LENGTH)} characters.`,
    )
  }

  if (detail !== undefined && typeof detail !== 'string') {
    throw new InvalidCopingItemError('detail', 'The detail must be text.')
  }

  const trimmedDetail = detail?.trim()

  if (trimmedDetail !== undefined && trimmedDetail.length > DETAIL_MAX_LENGTH) {
    throw new InvalidCopingItemError(
      'detail',
      `The detail can be at most ${String(DETAIL_MAX_LENGTH)} characters.`,
    )
  }

  // A blank detail is no detail: it is left out instead of being saved as an empty string.
  return trimmedDetail
    ? { type, text: trimmedText, detail: trimmedDetail }
    : { type, text: trimmedText }
}

/**
 * Tells whether something read back from storage is a complete, valid item. Anything else, such
 * as a damaged row, is left out of the list instead of breaking it.
 */
export function isCopingItem(value: unknown): value is CopingItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  if (!('id' in value) || typeof value.id !== 'number') {
    return false
  }

  try {
    validateNewCopingItem(value)
  } catch (error) {
    if (error instanceof InvalidCopingItemError) {
      return false
    }
    throw error
  }

  return true
}
