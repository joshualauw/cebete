import type { NewThoughtRecord } from '@/thoughts/types'

/** A thought record as stored, in the current layout. */
export function currentThought(id: number, extra: object = {}): object {
  return {
    id,
    emotions: [{ emotion: 'anxious', intensity: 7 }],
    thought: 'I will fail',
    belief: 8,
    createdAt: 1_700_000_000_000 + id,
    ...extra,
  }
}

/** The smallest valid thought record to add. */
export function newThought(extra: Partial<NewThoughtRecord> = {}): NewThoughtRecord {
  return {
    emotions: [{ emotion: 'anxious', intensity: 7 }],
    thought: 'I will fail',
    belief: 8,
    ...extra,
  }
}

/** A planned test as stored. */
export function currentPlannedTest(extra: object = {}): object {
  return {
    status: 'planned',
    plan: 'Say hello to two people on Monday',
    prediction: 'Nobody will answer',
    ...extra,
  }
}

/** A test whose result is logged, as stored. */
export function currentDoneTest(extra: object = {}): object {
  return {
    ...currentPlannedTest({ status: 'done' }),
    result: 'Both of them answered',
    belief: 3,
    ...extra,
  }
}

/** Body notes as stored, in the order of the body areas. */
export function currentBody(): object[] {
  return [
    { area: 'chest', description: 'tight' },
    { area: 'stomach' },
    { area: 'hands', description: 'shaky and cold' },
  ]
}

/** A challenge as stored, for the record made by `currentThought` or `newThought`. */
export function currentChallenge(extra: object = {}): object {
  return {
    evidenceFor: 'I have stumbled before',
    evidenceAgainst: 'I have prepared well',
    balanced: 'I may stumble, but I can recover',
    belief: 4,
    emotions: [{ emotion: 'anxious', intensity: 3 }],
    ...extra,
  }
}
