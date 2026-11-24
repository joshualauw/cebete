import { afterEach, describe, expect, it, vi } from 'vitest'

import { NOTE_MAX_LENGTH } from '@/mood/types'
import {
  InvalidMoodEntryError,
  validateMoodEntryChanges,
  validateRecordedTime,
} from '@/mood/validation'

const NOW = 2_000_000
const valid = { emotions: [{ emotion: 'calm', intensity: 4 }], createdAt: 1_000_000 }

afterEach(() => {
  vi.restoreAllMocks()
})

function reason(input: unknown): InvalidMoodEntryError {
  vi.spyOn(Date, 'now').mockReturnValue(NOW)

  try {
    validateMoodEntryChanges(input)
  } catch (error) {
    if (error instanceof InvalidMoodEntryError) {
      return error
    }
    throw error
  }

  throw new Error('The edit was accepted')
}

describe('validateMoodEntryChanges', () => {
  it('accepts an edit and returns a clean copy that keeps the time it was given', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    const result = validateMoodEntryChanges({ ...valid, note: '  better now  ', extra: 'ignored' })

    expect(result).toEqual({ ...valid, note: 'better now' })
  })

  it('leaves a blank note out', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    expect(validateMoodEntryChanges({ ...valid, note: '   ' })).toEqual(valid)
  })

  it('accepts a time of exactly now', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    expect(validateMoodEntryChanges({ ...valid, createdAt: NOW }).createdAt).toBe(NOW)
  })

  it('refuses a time in the future, with a message about the time', () => {
    const error = reason({ ...valid, createdAt: NOW + 1 })

    expect(error.field).toBe('time')
    expect(error.message).toMatch(/future/i)
  })

  it.each([
    ['missing', undefined],
    ['not a number', '2026-11-24'],
    ['not a real moment', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('refuses a time that is %s', (_name, createdAt) => {
    expect(reason({ ...valid, createdAt }).field).toBe('time')
  })

  it('applies the same rules as a new entry', () => {
    expect(reason({ ...valid, emotions: [] }).field).toBe('emotions')
    expect(
      reason({
        ...valid,
        emotions: [
          { emotion: 'calm', intensity: 1 },
          { emotion: 'calm', intensity: 2 },
        ],
      }).field,
    ).toBe('emotions')
    expect(reason({ ...valid, emotions: [{ emotion: 'calm', intensity: 11 }] }).field).toBe(
      'intensity',
    )
    expect(reason({ ...valid, note: 'x'.repeat(NOTE_MAX_LENGTH + 1) }).field).toBe('note')
  })
})

describe('validateRecordedTime', () => {
  it('returns a time in the past or exactly now as it is', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    expect(validateRecordedTime(1)).toBe(1)
    expect(validateRecordedTime(NOW)).toBe(NOW)
  })

  it.each([
    ['text', '2020-01-01'],
    ['a date object', new Date(1_000)],
    ['null', null],
    ['missing', undefined],
    ['not a real moment', Number.NaN],
  ])('refuses %s, as a problem with the time', (_name, value) => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    expect(() => validateRecordedTime(value)).toThrow(InvalidMoodEntryError)
    expect(() => validateRecordedTime(value)).toThrow(/valid date and time/i)
  })

  it('refuses a time in the future', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    expect(() => validateRecordedTime(NOW + 1)).toThrow(/future/i)
  })
})
