import { describe, expect, it } from 'vitest'

import { convertLegacyEntry } from '@/mood/migration'
import { isMoodEntry } from '@/mood/validation'

function legacy(intensity: number, extra: object = {}): object {
  return { id: 3, emotion: 'anxious', intensity, createdAt: 1_700_000_000_000, ...extra }
}

describe('convertLegacyEntry: the new rating', () => {
  it.each([
    [0, 0],
    [4, 0],
    [5, 1],
    [14, 1],
    [15, 2],
    [49, 5],
    [50, 5],
    [92, 9],
    [95, 10],
    [100, 10],
  ])('turns the old rating %i into %i', (old, expected) => {
    expect(convertLegacyEntry(legacy(old))).toMatchObject({
      emotions: [{ emotion: 'anxious', intensity: expected }],
    })
  })

  it('rounds a rating that is not a whole number', () => {
    expect(convertLegacyEntry(legacy(49.6))).toMatchObject({
      emotions: [{ intensity: 5 }],
    })
  })

  it.each([
    [250, 10],
    [1000, 10],
    [-30, 0],
    [-1, 0],
  ])('keeps the rating %i inside 0 to 10 (as %i)', (old, expected) => {
    expect(convertLegacyEntry(legacy(old))).toMatchObject({
      emotions: [{ intensity: expected }],
    })
  })
})

describe('convertLegacyEntry: what is kept', () => {
  it('keeps the id, note and time, and drops the old fields', () => {
    const converted = convertLegacyEntry(legacy(70, { note: 'before the meeting' }))

    expect(converted).toEqual({
      id: 3,
      note: 'before the meeting',
      createdAt: 1_700_000_000_000,
      emotions: [{ emotion: 'anxious', intensity: 7 }],
    })
  })

  it('leaves an entry without a note without one', () => {
    const converted = convertLegacyEntry(legacy(70))

    expect(converted).toEqual({
      id: 3,
      createdAt: 1_700_000_000_000,
      emotions: [{ emotion: 'anxious', intensity: 7 }],
    })
  })

  it('makes an entry that the rest of the app accepts', () => {
    expect(isMoodEntry(convertLegacyEntry(legacy(92, { note: 'a lovely walk' })))).toBe(true)
  })

  it('does not change the entry it was given', () => {
    const original = Object.freeze(legacy(70, { note: 'kept' }))

    expect(() => convertLegacyEntry(original)).not.toThrow()
    expect(original).toEqual(legacy(70, { note: 'kept' }))
  })
})

describe('convertLegacyEntry: things it must leave alone', () => {
  it('returns an entry that is already in the new layout as it is', () => {
    const current = { id: 1, emotions: [{ emotion: 'calm', intensity: 4 }], createdAt: 1 }

    expect(convertLegacyEntry(current)).toBe(current)
  })

  it('is safe to run twice: the second run changes nothing', () => {
    const once = convertLegacyEntry(legacy(70))

    expect(convertLegacyEntry(once)).toBe(once)
  })

  it.each([
    ['null', null],
    ['text', 'calm'],
    ['a number', 5],
    ['nothing', undefined],
    ['a list', []],
    ['an empty object', {}],
    ['an entry with no emotion', { id: 1, intensity: 40, createdAt: 1 }],
    ['an entry with an unknown emotion', { id: 1, emotion: 'bogus', intensity: 40, createdAt: 1 }],
    ['an entry with a text rating', { id: 1, emotion: 'calm', intensity: '40', createdAt: 1 }],
    [
      'an entry with a rating that is not a number',
      { id: 1, emotion: 'calm', intensity: Number.NaN },
    ],
    ['an entry with an endless rating', { id: 1, emotion: 'calm', intensity: Infinity }],
    ['an entry with no rating', { id: 1, emotion: 'calm', createdAt: 1 }],
  ])('returns %s untouched, without throwing', (_label, value) => {
    expect(convertLegacyEntry(value)).toBe(value)
  })
})
