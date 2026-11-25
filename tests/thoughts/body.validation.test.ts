import { describe, expect, it } from 'vitest'

import { BODY_AREAS, bodyAreaLabel, isBodyArea } from '@/thoughts/body'
import { InvalidThoughtRecordError } from '@/thoughts/errors'
import { TEXT_MAX_LENGTH } from '@/thoughts/types'
import { isThoughtRecord, validateBody } from '@/thoughts/validation'
import { currentBody, currentThought } from '@tests/helpers/thoughts'

function fieldOf(input: unknown): string {
  try {
    validateBody(input)
  } catch (error) {
    if (error instanceof InvalidThoughtRecordError) {
      return error.field
    }
    throw error
  }

  throw new Error('The body notes were accepted')
}

describe('the body areas', () => {
  it('are the seven places, in a fixed order, each with a plain name', () => {
    expect(BODY_AREAS).toEqual([
      'head',
      'throat-neck',
      'chest',
      'stomach',
      'hands',
      'legs',
      'whole-body',
    ])
    expect(BODY_AREAS.map((area) => bodyAreaLabel(area))).toEqual([
      'Head',
      'Throat and neck',
      'Chest',
      'Stomach',
      'Hands',
      'Legs',
      'Whole body',
    ])
  })

  it('tells an area from anything else', () => {
    expect(isBodyArea('chest')).toBe(true)
    expect(isBodyArea('elbow')).toBe(false)
    expect(isBodyArea(3)).toBe(false)
    expect(isBodyArea(undefined)).toBe(false)
  })
})

describe('validateBody', () => {
  it('accepts notes, trims descriptions, and leaves blank ones out', () => {
    expect(
      validateBody([
        { area: 'chest', description: '  tight  ' },
        { area: 'stomach', description: '   ' },
        { area: 'hands' },
      ]),
    ).toEqual([{ area: 'chest', description: 'tight' }, { area: 'stomach' }, { area: 'hands' }])
  })

  it('returns them in the order of the body areas, whatever order they were given', () => {
    const result = validateBody([{ area: 'legs' }, { area: 'head' }, { area: 'chest' }])

    expect(result.map(({ area }) => area)).toEqual(['head', 'chest', 'legs'])
  })

  it('accepts an empty list, which means there are no notes', () => {
    expect(validateBody([])).toEqual([])
  })

  it('builds the result from the checked fields only', () => {
    expect(validateBody([{ area: 'head', description: 'x', extra: 'y' }])).toEqual([
      { area: 'head', description: 'x' },
    ])
  })

  it('accepts all seven areas together', () => {
    expect(validateBody(BODY_AREAS.map((area) => ({ area })))).toHaveLength(7)
  })

  it.each<readonly [string, unknown]>([
    ['something that is not a list', { area: 'chest' }],
    ['null', null],
    ['a note that is not an object', ['chest']],
    ['a note with no area', [{ description: 'tight' }]],
    ['an area that is not in the list', [{ area: 'elbow' }]],
    ['an area that is not text', [{ area: 4 }]],
    ['the same area twice', [{ area: 'chest' }, { area: 'chest', description: 'again' }]],
    ['a description that is not text', [{ area: 'chest', description: 7 }]],
  ])('refuses %s', (_name, input) => {
    expect(fieldOf(input)).toBe('body')
  })

  it('accepts a description of exactly the longest length, and refuses one longer', () => {
    const longest = 'a'.repeat(TEXT_MAX_LENGTH)

    expect(validateBody([{ area: 'chest', description: longest }])).toEqual([
      { area: 'chest', description: longest },
    ])
    expect(fieldOf([{ area: 'chest', description: `${longest}a` }])).toBe('body')
  })

  it('measures the length after trimming', () => {
    const longest = 'a'.repeat(TEXT_MAX_LENGTH)

    expect(validateBody([{ area: 'chest', description: `  ${longest}  ` }])).toEqual([
      { area: 'chest', description: longest },
    ])
  })

  it('explains a refusal in plain words', () => {
    expect(() => validateBody([{ area: 'chest' }, { area: 'chest' }])).toThrow(
      'Each body area can be noted only once.',
    )
    expect(() => validateBody([{ area: 'elbow' }])).toThrow('Choose body areas from the list.')
  })
})

describe('isThoughtRecord and the body notes', () => {
  it('accepts a record with notes, with an empty list, and with none', () => {
    expect(isThoughtRecord(currentThought(1))).toBe(true)
    expect(isThoughtRecord(currentThought(1, { body: currentBody() }))).toBe(true)
    expect(isThoughtRecord(currentThought(1, { body: [] }))).toBe(true)
  })

  it('treats a record with damaged notes as unreadable', () => {
    expect(isThoughtRecord(currentThought(1, { body: [{ area: 'elbow' }] }))).toBe(false)
    expect(
      isThoughtRecord(currentThought(1, { body: [{ area: 'chest' }, { area: 'chest' }] })),
    ).toBe(false)
    expect(isThoughtRecord(currentThought(1, { body: 'chest' }))).toBe(false)
  })
})
