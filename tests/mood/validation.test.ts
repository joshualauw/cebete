import { describe, expect, it } from 'vitest'

import { MAX_EMOTIONS, NOTE_MAX_LENGTH } from '@/mood/types'
import {
  InvalidMoodEntryError,
  type InvalidMoodEntryField,
  isMoodEntry,
  validateNewMoodEntry,
} from '@/mood/validation'

/** Runs the validation and reports which field it complained about, or undefined if it passed. */
function rejectedField(input: unknown): InvalidMoodEntryField | undefined {
  try {
    validateNewMoodEntry(input)
  } catch (error) {
    if (error instanceof InvalidMoodEntryError) {
      return error.field
    }
    throw error
  }

  return undefined
}

const calm = { emotion: 'calm', intensity: 4 }

describe('validateNewMoodEntry: accepted entries', () => {
  it('accepts one emotion with a rating', () => {
    expect(validateNewMoodEntry({ emotions: [calm] })).toEqual({ emotions: [calm] })
  })

  it('accepts up to the maximum number of emotions, keeping the order they were chosen in', () => {
    const emotions = [
      { emotion: 'sad', intensity: 2 },
      { emotion: 'anxious', intensity: 7 },
      { emotion: 'hopeful', intensity: 5 },
    ]

    expect(emotions).toHaveLength(MAX_EMOTIONS)
    expect(validateNewMoodEntry({ emotions }).emotions).toEqual(emotions)
  })

  it.each([0, 10])('accepts the boundary rating %i', (intensity) => {
    expect(rejectedField({ emotions: [{ emotion: 'happy', intensity }] })).toBeUndefined()
  })

  it('keeps an optional note, trimmed', () => {
    expect(validateNewMoodEntry({ emotions: [calm], note: '  rough day  ' })).toEqual({
      emotions: [calm],
      note: 'rough day',
    })
  })

  it.each(['', '   ', '\n\t'])('leaves out an empty note (%j)', (note) => {
    const entry = validateNewMoodEntry({ emotions: [calm], note })

    expect('note' in entry).toBe(false)
  })

  it('accepts a note of exactly the maximum length, and counts it after trimming', () => {
    const note = 'a'.repeat(NOTE_MAX_LENGTH)

    expect(rejectedField({ emotions: [calm], note })).toBeUndefined()
    expect(rejectedField({ emotions: [calm], note: `  ${note}  ` })).toBeUndefined()
  })

  it('returns a clean copy, dropping anything unexpected such as a time or an id', () => {
    const entry = validateNewMoodEntry({
      emotions: [{ ...calm, extra: true }],
      createdAt: 123,
      id: 9,
      extra: true,
    })

    expect(entry).toEqual({ emotions: [calm] })
  })
})

describe('validateNewMoodEntry: rejected entries', () => {
  it.each([undefined, null, 'calm', 5, true])('rejects %j as not an entry', (input) => {
    expect(rejectedField(input)).toBe('entry')
  })

  it.each([undefined, null, 'calm', {}, 5])(
    'rejects %j instead of a list of emotions',
    (emotions) => {
      expect(rejectedField({ emotions })).toBe('emotions')
    },
  )

  it('rejects an entry with no emotion', () => {
    expect(rejectedField({ emotions: [] })).toBe('emotions')
  })

  it('rejects more than the maximum number of emotions', () => {
    const emotions = ['calm', 'happy', 'sad', 'tired'].map((emotion) => ({ emotion, intensity: 5 }))

    expect(emotions.length).toBeGreaterThan(MAX_EMOTIONS)
    expect(rejectedField({ emotions })).toBe('emotions')
  })

  it('rejects the same emotion chosen twice', () => {
    const emotions = [
      { emotion: 'calm', intensity: 3 },
      { emotion: 'calm', intensity: 8 },
    ]

    expect(rejectedField({ emotions })).toBe('emotions')
  })

  it.each([undefined, null, '', 'bogus', 'CALM', 5])('rejects the emotion %j', (emotion) => {
    expect(rejectedField({ emotions: [{ emotion, intensity: 5 }] })).toBe('emotions')
  })

  it.each([undefined, null, 'calm', 5])(
    'rejects %j in place of an emotion and its rating',
    (item) => {
      expect(rejectedField({ emotions: [item] })).toBe('emotions')
    },
  )

  it.each([undefined, null, '5', 1.5, -1, 11, 100, 0.1, Number.NaN, Infinity])(
    'rejects the rating %j',
    (intensity) => {
      expect(rejectedField({ emotions: [{ emotion: 'calm', intensity }] })).toBe('intensity')
    },
  )

  it('rejects the old 0 to 100 ratings, now that the scale is 0 to 10', () => {
    expect(rejectedField({ emotions: [{ emotion: 'calm', intensity: 70 }] })).toBe('intensity')
  })

  it('rejects one bad rating among good ones', () => {
    const emotions = [calm, { emotion: 'sad', intensity: 11 }]

    expect(rejectedField({ emotions })).toBe('intensity')
  })

  it('rejects the old single-emotion layout', () => {
    expect(rejectedField({ emotion: 'calm', intensity: 5 })).toBe('emotions')
  })

  it('rejects a note that is not text', () => {
    expect(rejectedField({ emotions: [calm], note: 5 })).toBe('note')
  })

  it('rejects a note over the maximum length', () => {
    const note = 'a'.repeat(NOTE_MAX_LENGTH + 1)

    expect(rejectedField({ emotions: [calm], note })).toBe('note')
  })

  it('reports the emotions first when several things are wrong', () => {
    expect(rejectedField({ emotions: [], note: 5 })).toBe('emotions')
    expect(rejectedField({ emotions: [{ emotion: 'bogus', intensity: 500 }], note: 5 })).toBe(
      'emotions',
    )
  })

  it('explains the problem in plain words', () => {
    expect(() => validateNewMoodEntry({ emotions: [{ emotion: 'calm', intensity: 11 }] })).toThrow(
      /whole number from 0 to 10/,
    )
    expect(() => validateNewMoodEntry({ emotions: [] })).toThrow(/between 1 and 3 emotions/)
  })
})

describe('isMoodEntry', () => {
  const stored = { id: 1, emotions: [calm], createdAt: 1_000 }

  it('accepts a complete entry', () => {
    expect(isMoodEntry(stored)).toBe(true)
    expect(isMoodEntry({ ...stored, note: 'a note' })).toBe(true)
  })

  it.each([
    ['without an id', { emotions: [calm], createdAt: 1 }],
    ['without a time', { id: 1, emotions: [calm] }],
    ['with a text id', { ...stored, id: '1' }],
    ['with no emotions', { ...stored, emotions: [] }],
    ['with a rating out of range', { ...stored, emotions: [{ emotion: 'calm', intensity: 50 }] }],
    ['in the old single-emotion layout', { id: 1, emotion: 'calm', intensity: 50, createdAt: 1 }],
    ['with a note that is not text', { ...stored, note: 5 }],
  ])('rejects an entry %s', (_label, value) => {
    expect(isMoodEntry(value)).toBe(false)
  })

  it.each([undefined, null, 'x', 5, []])('rejects %j', (value) => {
    expect(isMoodEntry(value)).toBe(false)
  })
})
