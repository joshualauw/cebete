import { afterEach, describe, expect, it, vi } from 'vitest'

import { InvalidThoughtRecordError } from '@/thoughts/errors'
import { TEXT_MAX_LENGTH } from '@/thoughts/types'
import {
  isThoughtRecord,
  validateNewThoughtRecord,
  validateThoughtRecordChanges,
} from '@/thoughts/validation'

const NOW = 2_000_000
const valid = {
  emotions: [{ emotion: 'anxious', intensity: 7 }],
  thought: 'I will fail',
  belief: 8,
}

afterEach(() => {
  vi.restoreAllMocks()
})

function reason(input: unknown): InvalidThoughtRecordError {
  vi.spyOn(Date, 'now').mockReturnValue(NOW)

  try {
    validateThoughtRecordChanges(input)
  } catch (error) {
    if (error instanceof InvalidThoughtRecordError) {
      return error
    }
    throw error
  }

  throw new Error('The record was accepted')
}

function fieldOf(input: unknown): string {
  try {
    validateNewThoughtRecord(input)
  } catch (error) {
    if (error instanceof InvalidThoughtRecordError) {
      return error.field
    }
    throw error
  }

  throw new Error('The record was accepted')
}

describe('validateNewThoughtRecord', () => {
  it('accepts a record with only the required parts', () => {
    expect(validateNewThoughtRecord(valid)).toEqual(valid)
  })

  it('accepts a full record and trims the text', () => {
    const result = validateNewThoughtRecord({
      ...valid,
      situation: '  Team meeting  ',
      action: '  stayed quiet ',
      thought: '  I will fail  ',
    })

    expect(result).toEqual({
      ...valid,
      situation: 'Team meeting',
      action: 'stayed quiet',
    })
  })

  it('leaves blank optional answers out instead of keeping empty text', () => {
    const result = validateNewThoughtRecord({ ...valid, situation: '   ', action: '' })

    expect(result).toEqual(valid)
    expect('situation' in result).toBe(false)
    expect('action' in result).toBe(false)
  })

  it('keeps the emotions in the order they were chosen, up to three', () => {
    const emotions = [
      { emotion: 'sad', intensity: 2 },
      { emotion: 'anxious', intensity: 7 },
      { emotion: 'hopeful', intensity: 5 },
    ]

    expect(validateNewThoughtRecord({ ...valid, emotions }).emotions).toEqual(emotions)
  })

  it('builds the result from the checked fields only', () => {
    const result = validateNewThoughtRecord({ ...valid, createdAt: 5, id: 9, extra: 'x' })

    expect(result).toEqual(valid)
  })

  it.each([
    ['no thought', { ...valid, thought: undefined }, 'thought'],
    ['a blank thought', { ...valid, thought: '   ' }, 'thought'],
    ['a thought that is not text', { ...valid, thought: 5 }, 'thought'],
    ['a too-long thought', { ...valid, thought: 'x'.repeat(TEXT_MAX_LENGTH + 1) }, 'thought'],
    ['a too-long situation', { ...valid, situation: 'x'.repeat(TEXT_MAX_LENGTH + 1) }, 'situation'],
    ['a too-long action', { ...valid, action: 'x'.repeat(TEXT_MAX_LENGTH + 1) }, 'action'],
    ['a situation that is not text', { ...valid, situation: 3 }, 'situation'],
    ['no feelings', { ...valid, emotions: [] }, 'emotions'],
    ['feelings missing', { thought: 'x', belief: 1 }, 'emotions'],
    [
      'a repeated emotion',
      {
        ...valid,
        emotions: [
          { emotion: 'calm', intensity: 1 },
          { emotion: 'calm', intensity: 2 },
        ],
      },
      'emotions',
    ],
    [
      'four emotions',
      {
        ...valid,
        emotions: ['calm', 'happy', 'sad', 'tired'].map((emotion) => ({ emotion, intensity: 1 })),
      },
      'emotions',
    ],
    [
      'a rating out of range',
      { ...valid, emotions: [{ emotion: 'calm', intensity: 11 }] },
      'emotions',
    ],
    ['a belief above 10', { ...valid, belief: 11 }, 'belief'],
    ['a belief below 0', { ...valid, belief: -1 }, 'belief'],
    ['a belief that is not whole', { ...valid, belief: 4.5 }, 'belief'],
    ['a belief that is not a number', { ...valid, belief: '5' }, 'belief'],
    ['no belief', { ...valid, belief: undefined }, 'belief'],
  ])('refuses %s', (_name, input, field) => {
    expect(fieldOf(input)).toBe(field)
  })

  it('refuses something that is not an object', () => {
    expect(fieldOf(null)).toBe('record')
    expect(fieldOf('text')).toBe('record')
  })

  it('accepts the lowest and highest belief and the longest text', () => {
    expect(validateNewThoughtRecord({ ...valid, belief: 0 }).belief).toBe(0)
    expect(validateNewThoughtRecord({ ...valid, belief: 10 }).belief).toBe(10)
    expect(
      validateNewThoughtRecord({ ...valid, thought: 'x'.repeat(TEXT_MAX_LENGTH) }).thought,
    ).toHaveLength(TEXT_MAX_LENGTH)
  })
})

describe('validateThoughtRecordChanges', () => {
  it('keeps the time it was given, and accepts a time of exactly now', () => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)

    expect(validateThoughtRecordChanges({ ...valid, createdAt: 1_000 }).createdAt).toBe(1_000)
    expect(validateThoughtRecordChanges({ ...valid, createdAt: NOW }).createdAt).toBe(NOW)
  })

  it('refuses a time in the future, with a message about it', () => {
    const error = reason({ ...valid, createdAt: NOW + 1 })

    expect(error.field).toBe('time')
    expect(error.message).toMatch(/future/i)
  })

  it.each([
    ['missing', undefined],
    ['text', '2020-01-01'],
    ['not a real moment', Number.NaN],
  ])('refuses a time that is %s', (_name, createdAt) => {
    expect(reason({ ...valid, createdAt }).field).toBe('time')
  })

  it('applies the same rules as a new record', () => {
    expect(reason({ ...valid, createdAt: 1, thought: '' }).field).toBe('thought')
    expect(reason({ ...valid, createdAt: 1, emotions: [] }).field).toBe('emotions')
  })
})

describe('isThoughtRecord', () => {
  const stored = { ...valid, id: 1, createdAt: 1_000 }

  it('accepts a complete record', () => {
    expect(isThoughtRecord(stored)).toBe(true)
  })

  it.each([
    ['without an id', { ...valid, createdAt: 1 }],
    ['without a time', { ...valid, id: 1 }],
    ['with an id that is not a number', { ...stored, id: '1' }],
    ['without a thought', { ...stored, thought: '' }],
    ['without feelings', { ...stored, emotions: [] }],
    ['with a belief out of range', { ...stored, belief: 50 }],
    ['that is null', null],
    ['that is text', 'record'],
  ])('refuses a row %s', (_name, row) => {
    expect(isThoughtRecord(row)).toBe(false)
  })
})
