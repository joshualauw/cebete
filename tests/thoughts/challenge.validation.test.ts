import { describe, expect, it } from 'vitest'

import { reconcileChallenge, sameEmotions } from '@/thoughts/challenge'
import { InvalidThoughtRecordError } from '@/thoughts/errors'
import { TEXT_MAX_LENGTH, type ThoughtChallenge } from '@/thoughts/types'
import { isThoughtRecord, validateChallenge } from '@/thoughts/validation'
import { currentChallenge, currentThought } from '@tests/helpers/thoughts'

function fieldOf(input: unknown): string {
  try {
    validateChallenge(input)
  } catch (error) {
    if (error instanceof InvalidThoughtRecordError) {
      return error.field
    }
    throw error
  }

  throw new Error('The challenge was accepted')
}

describe('validateChallenge', () => {
  it('accepts a full challenge and trims the text', () => {
    const result = validateChallenge(
      currentChallenge({
        evidenceFor: '  one  ',
        evidenceAgainst: ' two ',
        balanced: '  balanced  ',
      }),
    )

    expect(result).toEqual({
      evidenceFor: 'one',
      evidenceAgainst: 'two',
      balanced: 'balanced',
      belief: 4,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
  })

  it('accepts a challenge with only the balanced thought, and leaves blank evidence out', () => {
    const result = validateChallenge(
      currentChallenge({ evidenceFor: '   ', evidenceAgainst: undefined }),
    )

    expect('evidenceFor' in result).toBe(false)
    expect('evidenceAgainst' in result).toBe(false)
  })

  it('builds the result from the checked fields only', () => {
    expect(validateChallenge({ ...currentChallenge(), id: 4, extra: 'x' })).not.toHaveProperty(
      'extra',
    )
  })

  it.each<readonly [string, object, string]>([
    ['no balanced thought', currentChallenge({ balanced: undefined }), 'balanced'],
    ['a blank balanced thought', currentChallenge({ balanced: '   ' }), 'balanced'],
    ['a balanced thought that is not text', currentChallenge({ balanced: 4 }), 'balanced'],
    [
      'a too-long balanced thought',
      currentChallenge({ balanced: 'x'.repeat(TEXT_MAX_LENGTH + 1) }),
      'balanced',
    ],
    [
      'too-long evidence for',
      currentChallenge({ evidenceFor: 'x'.repeat(TEXT_MAX_LENGTH + 1) }),
      'evidenceFor',
    ],
    [
      'too-long evidence against',
      currentChallenge({ evidenceAgainst: 'x'.repeat(TEXT_MAX_LENGTH + 1) }),
      'evidenceAgainst',
    ],
    ['a belief above 10', currentChallenge({ belief: 11 }), 'belief'],
    ['a belief below 0', currentChallenge({ belief: -1 }), 'belief'],
    ['a belief that is not whole', currentChallenge({ belief: 2.5 }), 'belief'],
    ['no belief', currentChallenge({ belief: undefined }), 'belief'],
    ['no feelings', currentChallenge({ emotions: [] }), 'emotions'],
    [
      'a feeling rated out of range',
      currentChallenge({ emotions: [{ emotion: 'anxious', intensity: 11 }] }),
      'emotions',
    ],
  ])('refuses %s', (_name, input, field) => {
    expect(fieldOf(input)).toBe(field)
  })

  it('refuses something that is not an object', () => {
    expect(fieldOf(null)).toBe('record')
    expect(fieldOf('text')).toBe('record')
  })

  it('accepts the lowest and highest belief and the longest text', () => {
    expect(validateChallenge(currentChallenge({ belief: 0 })).belief).toBe(0)
    expect(validateChallenge(currentChallenge({ belief: 10 })).belief).toBe(10)
    expect(
      validateChallenge(currentChallenge({ balanced: 'x'.repeat(TEXT_MAX_LENGTH) })).balanced,
    ).toHaveLength(TEXT_MAX_LENGTH)
  })
})

describe('isThoughtRecord with a challenge', () => {
  it('accepts a record without a challenge, and one with a matching challenge', () => {
    expect(isThoughtRecord(currentThought(1))).toBe(true)
    expect(isThoughtRecord(currentThought(1, { challenge: currentChallenge() }))).toBe(true)
  })

  it('accepts a challenge whose feelings are in another order', () => {
    const record = currentThought(1, {
      emotions: [
        { emotion: 'anxious', intensity: 7 },
        { emotion: 'sad', intensity: 3 },
      ],
      challenge: currentChallenge({
        emotions: [
          { emotion: 'sad', intensity: 1 },
          { emotion: 'anxious', intensity: 2 },
        ],
      }),
    })

    expect(isThoughtRecord(record)).toBe(true)
  })

  it.each<readonly [string, object]>([
    ['no balanced thought', currentChallenge({ balanced: '' })],
    ['a belief out of range', currentChallenge({ belief: 99 })],
    [
      'feelings that differ from the record',
      currentChallenge({ emotions: [{ emotion: 'sad', intensity: 1 }] }),
    ],
    [
      'more feelings than the record',
      currentChallenge({
        emotions: [
          { emotion: 'anxious', intensity: 1 },
          { emotion: 'sad', intensity: 1 },
        ],
      }),
    ],
  ])('refuses a record whose challenge has %s', (_name, challenge) => {
    expect(isThoughtRecord(currentThought(1, { challenge }))).toBe(false)
  })

  it('refuses a challenge that is not an object', () => {
    expect(isThoughtRecord(currentThought(1, { challenge: 'done' }))).toBe(false)
  })
})

describe('sameEmotions', () => {
  it('compares the emotions, ignoring order and ratings', () => {
    expect(
      sameEmotions(
        [
          { emotion: 'calm', intensity: 1 },
          { emotion: 'sad', intensity: 2 },
        ],
        [
          { emotion: 'sad', intensity: 9 },
          { emotion: 'calm', intensity: 8 },
        ],
      ),
    ).toBe(true)
    expect(
      sameEmotions([{ emotion: 'calm', intensity: 1 }], [{ emotion: 'sad', intensity: 1 }]),
    ).toBe(false)
    expect(sameEmotions([{ emotion: 'calm', intensity: 1 }], [])).toBe(false)
  })
})

describe('reconcileChallenge', () => {
  const challenge: ThoughtChallenge = {
    balanced: 'balanced',
    belief: 3,
    emotions: [
      { emotion: 'anxious', intensity: 2 },
      { emotion: 'sad', intensity: 1 },
    ],
  }

  it('keeps the rating of a feeling that remains, and follows the record order', () => {
    expect(
      reconcileChallenge(challenge, [
        { emotion: 'sad', intensity: 6 },
        { emotion: 'anxious', intensity: 8 },
      ]).emotions,
    ).toEqual([
      { emotion: 'sad', intensity: 1 },
      { emotion: 'anxious', intensity: 2 },
    ])
  })

  it('starts a new feeling at its rating in the record', () => {
    expect(
      reconcileChallenge(challenge, [
        { emotion: 'anxious', intensity: 8 },
        { emotion: 'sad', intensity: 6 },
        { emotion: 'tired', intensity: 7 },
      ]).emotions,
    ).toEqual([
      { emotion: 'anxious', intensity: 2 },
      { emotion: 'sad', intensity: 1 },
      { emotion: 'tired', intensity: 7 },
    ])
  })

  it('drops a feeling that was removed, and leaves the rest of the challenge alone', () => {
    const result = reconcileChallenge(challenge, [{ emotion: 'sad', intensity: 6 }])

    expect(result.emotions).toEqual([{ emotion: 'sad', intensity: 1 }])
    expect(result.balanced).toBe('balanced')
    expect(result.belief).toBe(3)
  })
})
