import { describe, expect, it } from 'vitest'

import { InvalidThoughtRecordError } from '@/thoughts/errors'
import { TEXT_MAX_LENGTH } from '@/thoughts/types'
import { isThoughtRecord, validateTest } from '@/thoughts/validation'
import { currentDoneTest, currentPlannedTest, currentThought } from '@tests/helpers/thoughts'

function fieldOf(input: unknown): string {
  try {
    validateTest(input)
  } catch (error) {
    if (error instanceof InvalidThoughtRecordError) {
      return error.field
    }
    throw error
  }

  throw new Error('The test was accepted')
}

describe('validateTest: a planned test', () => {
  it('accepts a plan and a prediction and trims the text', () => {
    expect(
      validateTest(currentPlannedTest({ plan: '  talk to two people  ', prediction: ' silence ' })),
    ).toEqual({ status: 'planned', plan: 'talk to two people', prediction: 'silence' })
  })

  it('builds the result from the checked fields only', () => {
    const result = validateTest({ ...currentPlannedTest(), result: 'x', belief: 2, extra: 'y' })

    expect(result).toEqual({
      status: 'planned',
      plan: 'Say hello to two people on Monday',
      prediction: 'Nobody will answer',
    })
  })

  it.each<readonly [string, object, string]>([
    ['no plan', currentPlannedTest({ plan: undefined }), 'plan'],
    ['a blank plan', currentPlannedTest({ plan: '   ' }), 'plan'],
    ['a plan that is not text', currentPlannedTest({ plan: 4 }), 'plan'],
    ['no prediction', currentPlannedTest({ prediction: undefined }), 'prediction'],
    ['a blank prediction', currentPlannedTest({ prediction: '  ' }), 'prediction'],
  ])('refuses %s, and names the field', (_name, input, field) => {
    expect(fieldOf(input)).toBe(field)
  })

  it('accepts a plan and a prediction of exactly the longest length, and refuses one longer', () => {
    const longest = 'a'.repeat(TEXT_MAX_LENGTH)

    expect(validateTest(currentPlannedTest({ plan: longest, prediction: longest }))).toMatchObject({
      plan: longest,
    })
    expect(fieldOf(currentPlannedTest({ plan: `${longest}a` }))).toBe('plan')
    expect(fieldOf(currentPlannedTest({ prediction: `${longest}a` }))).toBe('prediction')
  })

  it('measures the length after trimming', () => {
    const longest = 'a'.repeat(TEXT_MAX_LENGTH)

    expect(validateTest(currentPlannedTest({ plan: `  ${longest}  ` }))).toMatchObject({
      plan: longest,
    })
  })
})

describe('validateTest: a done test', () => {
  it('accepts the result and the belief now, and trims the text', () => {
    expect(validateTest(currentDoneTest({ result: '  they replied  ' }))).toEqual({
      status: 'done',
      plan: 'Say hello to two people on Monday',
      prediction: 'Nobody will answer',
      result: 'they replied',
      belief: 3,
    })
  })

  it.each<readonly [string, object, string]>([
    ['no result', currentDoneTest({ result: undefined }), 'result'],
    ['a blank result', currentDoneTest({ result: '  ' }), 'result'],
    ['a result that is not text', currentDoneTest({ result: 7 }), 'result'],
    ['no belief', currentDoneTest({ belief: undefined }), 'belief'],
    ['a belief above 10', currentDoneTest({ belief: 11 }), 'belief'],
    ['a belief below 0', currentDoneTest({ belief: -1 }), 'belief'],
    ['a belief that is not whole', currentDoneTest({ belief: 2.5 }), 'belief'],
    ['a belief that is not a number', currentDoneTest({ belief: '3' }), 'belief'],
    ['a missing plan', currentDoneTest({ plan: '' }), 'plan'],
  ])('refuses %s, and names the field', (_name, input, field) => {
    expect(fieldOf(input)).toBe(field)
  })

  it('accepts the belief limits 0 and 10', () => {
    expect(validateTest(currentDoneTest({ belief: 0 }))).toMatchObject({ belief: 0 })
    expect(validateTest(currentDoneTest({ belief: 10 }))).toMatchObject({ belief: 10 })
  })

  it('refuses a result longer than the limit', () => {
    expect(fieldOf(currentDoneTest({ result: 'a'.repeat(TEXT_MAX_LENGTH + 1) }))).toBe('result')
  })
})

describe('validateTest: anything else', () => {
  it.each<readonly [string, unknown]>([
    ['something that is not an object', 'a test'],
    ['null', null],
    ['an object with no status', { plan: 'a', prediction: 'b' }],
    ['an object with an unknown status', currentPlannedTest({ status: 'started' })],
  ])('refuses %s', (_name, input) => {
    expect(fieldOf(input)).toBe('record')
  })
})

describe('isThoughtRecord and the test', () => {
  it('accepts a record with a planned test or a done test, and one without', () => {
    expect(isThoughtRecord(currentThought(1))).toBe(true)
    expect(isThoughtRecord(currentThought(1, { test: currentPlannedTest() }))).toBe(true)
    expect(isThoughtRecord(currentThought(1, { test: currentDoneTest() }))).toBe(true)
  })

  it('accepts a record with a challenge and a test together', () => {
    expect(
      isThoughtRecord(
        currentThought(1, {
          test: currentDoneTest(),
          challenge: {
            balanced: 'I can cope',
            belief: 4,
            emotions: [{ emotion: 'anxious', intensity: 3 }],
          },
        }),
      ),
    ).toBe(true)
  })

  it('treats a record with a damaged test as unreadable', () => {
    expect(isThoughtRecord(currentThought(1, { test: currentPlannedTest({ plan: '' }) }))).toBe(
      false,
    )
    expect(isThoughtRecord(currentThought(1, { test: currentDoneTest({ belief: 11 }) }))).toBe(
      false,
    )
    expect(isThoughtRecord(currentThought(1, { test: 'planned' }))).toBe(false)
  })
})
