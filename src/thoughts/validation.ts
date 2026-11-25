import {
  InvalidMoodEntryError,
  validateEmotionRatings,
  validateRecordedTime,
} from '@/mood/validation'

import { BODY_AREAS, type BodyNote, isBodyArea } from './body'
import { sameEmotions } from './challenge'
import { InvalidThoughtRecordError, type InvalidThoughtRecordField } from './errors'
import {
  BELIEF_MAX,
  BELIEF_MIN,
  type NewThoughtRecord,
  TEXT_MAX_LENGTH,
  type ThoughtChallenge,
  type ThoughtRecord,
  type ThoughtRecordChanges,
  type ThoughtTest,
} from './types'

/** Runs a Mood check and reports its failure as a problem with the thought record. */
function asThoughtRecordCheck<T>(check: () => T): T {
  try {
    return check()
  } catch (error) {
    if (error instanceof InvalidMoodEntryError) {
      const field = error.field === 'intensity' || error.field === 'note' ? 'emotions' : error.field

      throw new InvalidThoughtRecordError(field === 'entry' ? 'record' : field, error.message)
    }
    throw error
  }
}

function checkedText(
  value: unknown,
  field: Extract<
    InvalidThoughtRecordField,
    | 'situation'
    | 'action'
    | 'thought'
    | 'evidenceFor'
    | 'evidenceAgainst'
    | 'balanced'
    | 'plan'
    | 'prediction'
    | 'result'
    | 'body'
  >,
  name: string,
): string {
  if (value !== undefined && typeof value !== 'string') {
    throw new InvalidThoughtRecordError(field, `${name} must be text.`)
  }

  const text = value?.trim() ?? ''

  if (text.length > TEXT_MAX_LENGTH) {
    throw new InvalidThoughtRecordError(
      field,
      `${name} can be at most ${String(TEXT_MAX_LENGTH)} characters.`,
    )
  }

  return text
}

function checkBelief(belief: unknown): asserts belief is number {
  if (
    typeof belief !== 'number' ||
    !Number.isInteger(belief) ||
    belief < BELIEF_MIN ||
    belief > BELIEF_MAX
  ) {
    throw new InvalidThoughtRecordError(
      'belief',
      `How much you believe it must be a whole number from ${String(BELIEF_MIN)} to ${String(BELIEF_MAX)}.`,
    )
  }
}

/**
 * A moment the app stamped on a part of a record. It may be absent, for parts saved before dates
 * existed, but a value that is there must be a real moment, or the part counts as damaged.
 */
function checkedMoment(
  value: unknown,
  field: 'challengedAt' | 'testedAt',
  name: string,
): number | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw new InvalidThoughtRecordError(field, `${name} must be a real moment.`)
  }

  return value
}

/**
 * Checks a thought record against the rules and returns a clean copy of it. The thought and at
 * least one feeling are required; blank optional answers are left out instead of being saved.
 */
export function validateNewThoughtRecord(input: unknown): NewThoughtRecord {
  if (typeof input !== 'object' || input === null) {
    throw new InvalidThoughtRecordError('record', 'A thought record must be an object.')
  }

  const emotions = asThoughtRecordCheck(() =>
    validateEmotionRatings('emotions' in input ? input.emotions : undefined),
  )
  const situation = checkedText(
    'situation' in input ? input.situation : undefined,
    'situation',
    'The situation',
  )
  const action = checkedText('action' in input ? input.action : undefined, 'action', 'What you did')
  const thought = checkedText(
    'thought' in input ? input.thought : undefined,
    'thought',
    'The thought',
  )
  const belief = 'belief' in input ? input.belief : undefined

  if (thought === '') {
    throw new InvalidThoughtRecordError('thought', 'Write the thought you had.')
  }

  checkBelief(belief)

  return {
    ...(situation && { situation }),
    emotions,
    ...(action && { action }),
    thought,
    belief,
  }
}

/**
 * Checks a challenge and returns a clean copy of it. The balanced thought is required; blank
 * evidence is left out. It does not know the record, so the feelings are only checked to be a
 * valid set of ratings here.
 */
export function validateChallenge(input: unknown): ThoughtChallenge {
  if (typeof input !== 'object' || input === null) {
    throw new InvalidThoughtRecordError('record', 'A challenge must be an object.')
  }

  const evidenceFor = checkedText(
    'evidenceFor' in input ? input.evidenceFor : undefined,
    'evidenceFor',
    'The evidence for the thought',
  )
  const evidenceAgainst = checkedText(
    'evidenceAgainst' in input ? input.evidenceAgainst : undefined,
    'evidenceAgainst',
    'The evidence against the thought',
  )
  const balanced = checkedText(
    'balanced' in input ? input.balanced : undefined,
    'balanced',
    'The balanced thought',
  )
  const belief = 'belief' in input ? input.belief : undefined
  const emotions = asThoughtRecordCheck(() =>
    validateEmotionRatings('emotions' in input ? input.emotions : undefined),
  )
  const challengedAt = checkedMoment(
    'challengedAt' in input ? input.challengedAt : undefined,
    'challengedAt',
    'The date of the challenge',
  )

  if (balanced === '') {
    throw new InvalidThoughtRecordError('balanced', 'Write a more balanced thought.')
  }

  checkBelief(belief)

  return {
    ...(evidenceFor && { evidenceFor }),
    ...(evidenceAgainst && { evidenceAgainst }),
    balanced,
    belief,
    emotions,
    ...(challengedAt !== undefined && { challengedAt }),
  }
}

/**
 * Checks a test and returns a clean copy of it. How and when, and the prediction, are required in
 * both states. A done test also needs what happened and the belief now.
 */
export function validateTest(input: unknown): ThoughtTest {
  if (typeof input !== 'object' || input === null) {
    throw new InvalidThoughtRecordError('record', 'A test must be an object.')
  }

  const plan = checkedText(
    'plan' in input ? input.plan : undefined,
    'plan',
    'How and when you test it',
  )
  const prediction = checkedText(
    'prediction' in input ? input.prediction : undefined,
    'prediction',
    'The prediction',
  )
  const status = 'status' in input ? input.status : undefined

  if (plan === '') {
    throw new InvalidThoughtRecordError('plan', 'Write how and when you could test this thought.')
  }

  if (prediction === '') {
    throw new InvalidThoughtRecordError('prediction', 'Write what you predict would happen.')
  }

  if (status === 'planned') {
    return { status, plan, prediction }
  }

  if (status !== 'done') {
    throw new InvalidThoughtRecordError('record', 'A test must be planned or done.')
  }

  const result = checkedText(
    'result' in input ? input.result : undefined,
    'result',
    'What happened',
  )
  const belief = 'belief' in input ? input.belief : undefined
  const testedAt = checkedMoment(
    'testedAt' in input ? input.testedAt : undefined,
    'testedAt',
    'The date of the test',
  )

  if (result === '') {
    throw new InvalidThoughtRecordError('result', 'Write what happened when you tested it.')
  }

  checkBelief(belief)

  return { status, plan, prediction, result, belief, ...(testedAt !== undefined && { testedAt }) }
}

/**
 * Checks the body notes of a record and returns a clean copy of them, in the fixed order of the
 * body areas. Each area may appear once, and blank descriptions are left out. An empty list is
 * valid: it means there are no notes.
 */
export function validateBody(input: unknown): readonly BodyNote[] {
  if (!Array.isArray(input)) {
    throw new InvalidThoughtRecordError('body', 'The body notes must be a list.')
  }

  const items: readonly unknown[] = input
  const notes: BodyNote[] = []

  for (const item of items) {
    if (typeof item !== 'object' || item === null || !('area' in item) || !isBodyArea(item.area)) {
      throw new InvalidThoughtRecordError('body', 'Choose body areas from the list.')
    }

    if (notes.some(({ area }) => area === item.area)) {
      throw new InvalidThoughtRecordError('body', 'Each body area can be noted only once.')
    }

    const description = checkedText(
      'description' in item ? item.description : undefined,
      'body',
      'The description',
    )

    notes.push({ area: item.area, ...(description && { description }) })
  }

  return BODY_AREAS.flatMap((area) => notes.filter((note) => note.area === area))
}

export function validateThoughtRecordTime(value: unknown): number {
  return asThoughtRecordCheck(() => validateRecordedTime(value))
}

/** Checks an edited record: the same rules as a new one, plus the time it happened. */
export function validateThoughtRecordChanges(input: unknown): ThoughtRecordChanges {
  const record = validateNewThoughtRecord(input)
  const createdAt = validateThoughtRecordTime(
    typeof input === 'object' && input !== null && 'createdAt' in input
      ? input.createdAt
      : undefined,
  )

  return { ...record, createdAt }
}

/** Tells whether something read back from storage is a complete, valid thought record. */
export function isThoughtRecord(value: unknown): value is ThoughtRecord {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  if (!('id' in value) || typeof value.id !== 'number') {
    return false
  }

  if (!('createdAt' in value) || typeof value.createdAt !== 'number') {
    return false
  }

  try {
    const record = validateNewThoughtRecord(value)

    if ('challenge' in value && value.challenge !== undefined) {
      const challenge = validateChallenge(value.challenge)

      if (!sameEmotions(record.emotions, challenge.emotions)) {
        return false
      }
    }

    if ('test' in value && value.test !== undefined) {
      validateTest(value.test)
    }

    if ('body' in value && value.body !== undefined) {
      validateBody(value.body)
    }
  } catch (error) {
    if (error instanceof InvalidThoughtRecordError) {
      return false
    }
    throw error
  }

  return true
}
