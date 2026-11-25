import { describe, expect, it } from 'vitest'

import { COPING_TYPES, DETAIL_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/coping/types'
import {
  InvalidCopingItemError,
  isCopingItem,
  isCopingType,
  validateNewCopingItem,
} from '@/coping/validation'

function fieldOfError(input: unknown): string | undefined {
  try {
    validateNewCopingItem(input)
  } catch (error) {
    return error instanceof InvalidCopingItemError ? error.field : 'unexpected'
  }
  return undefined
}

describe('validateNewCopingItem', () => {
  it.each(COPING_TYPES)('accepts an item of the %s kind', (type) => {
    expect(validateNewCopingItem({ type, text: 'Something' })).toEqual({ type, text: 'Something' })
  })

  it('keeps a detail and trims the text and the detail', () => {
    expect(
      validateNewCopingItem({ type: 'do', text: '  Slow breathing ', detail: ' in 4, out 6 ' }),
    ).toEqual({ type: 'do', text: 'Slow breathing', detail: 'in 4, out 6' })
  })

  it('leaves a blank detail out instead of saving an empty one', () => {
    expect(validateNewCopingItem({ type: 'say', text: 'This will pass', detail: '   ' })).toEqual({
      type: 'say',
      text: 'This will pass',
    })
  })

  it('builds the result from the checked fields only', () => {
    const result = validateNewCopingItem({ type: 'do', text: 'Walk', id: 9, extra: true })

    expect(result).toEqual({ type: 'do', text: 'Walk' })
  })

  it.each([
    ['nothing', undefined],
    ['a string', 'text'],
    ['null', null],
  ])('refuses %s instead of an item', (_label, input) => {
    expect(fieldOfError(input)).toBe('item')
  })

  it.each([undefined, 'dance', 3, null])('refuses the kind %s', (type) => {
    expect(fieldOfError({ type, text: 'Walk' })).toBe('type')
  })

  it.each([undefined, '', '   ', 5])('refuses the text %s', (text) => {
    expect(fieldOfError({ type: 'do', text })).toBe('text')
  })

  it('accepts a text of exactly the limit and refuses one character more', () => {
    expect(fieldOfError({ type: 'do', text: 'a'.repeat(TEXT_MAX_LENGTH) })).toBeUndefined()
    expect(fieldOfError({ type: 'do', text: 'a'.repeat(TEXT_MAX_LENGTH + 1) })).toBe('text')
  })

  it('counts the limit after trimming', () => {
    const padded = ` ${'a'.repeat(TEXT_MAX_LENGTH)} `

    expect(fieldOfError({ type: 'do', text: padded })).toBeUndefined()
  })

  it('accepts a detail of exactly the limit and refuses one character more', () => {
    const text = { type: 'do', text: 'Walk' }

    expect(fieldOfError({ ...text, detail: 'a'.repeat(DETAIL_MAX_LENGTH) })).toBeUndefined()
    expect(fieldOfError({ ...text, detail: 'a'.repeat(DETAIL_MAX_LENGTH + 1) })).toBe('detail')
  })

  it('refuses a detail that is not text', () => {
    expect(fieldOfError({ type: 'do', text: 'Walk', detail: 4 })).toBe('detail')
  })

  it('explains a refusal in plain words', () => {
    expect(() => validateNewCopingItem({ type: 'do', text: ' ' })).toThrow(/short text/i)
  })
})

describe('isCopingType', () => {
  it('knows the four kinds and nothing else', () => {
    expect(COPING_TYPES.every((type) => isCopingType(type))).toBe(true)
    expect(isCopingType('walk')).toBe(false)
    expect(isCopingType(undefined)).toBe(false)
  })
})

describe('isCopingItem', () => {
  it('accepts a complete stored item', () => {
    expect(isCopingItem({ id: 1, type: 'about', text: "I'm a good listener" })).toBe(true)
  })

  it.each([
    ['without an id', { type: 'do', text: 'Walk' }],
    ['with an id that is not a number', { id: '1', type: 'do', text: 'Walk' }],
    ['with an unknown kind', { id: 1, type: 'sing', text: 'Walk' }],
    ['with no text', { id: 1, type: 'do' }],
    ['that is not an object', 'row'],
    ['that is null', null],
  ])('refuses a row %s', (_label, row) => {
    expect(isCopingItem(row)).toBe(false)
  })
})
