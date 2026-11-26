import type { Emotion } from '@/mood/emotions'
import type { MoodEntry } from '@/mood/types'
import type { ThoughtChallenge, ThoughtRecord, ThoughtTest } from '@/thoughts/types'

/** A local moment, so a test does not depend on the time zone it runs in. */
export function localMoment(
  year: number,
  month: number,
  day: number,
  hour = 12,
  minute = 0,
): number {
  return new Date(year, month - 1, day, hour, minute).getTime()
}

/** A mood entry that names the given emotions, all rated the same. */
export function moodEntryAt(
  createdAt: number,
  names: readonly Emotion[],
  id = createdAt,
): MoodEntry {
  return { id, createdAt, emotions: names.map((emotion) => ({ emotion, intensity: 5 })) }
}

/** A challenge with the given belief after it, dated when a date is given. */
export function challengeOf(belief: number, challengedAt?: number): ThoughtChallenge {
  return {
    balanced: 'a more balanced thought',
    belief,
    emotions: [{ emotion: 'anxious', intensity: 5 }],
    ...(challengedAt !== undefined && { challengedAt }),
  }
}

/** A logged test with the given belief after it, dated when a date is given. */
export function doneTestOf(belief: number, testedAt?: number): ThoughtTest {
  return {
    status: 'done',
    plan: 'a plan',
    prediction: 'a prediction',
    result: 'a result',
    belief,
    ...(testedAt !== undefined && { testedAt }),
  }
}

/** A test that is only planned. */
export const plannedTest: ThoughtTest = {
  status: 'planned',
  plan: 'a plan',
  prediction: 'a prediction',
}

type ThoughtOptions = {
  readonly thought?: string
  readonly belief?: number
  readonly challenge?: ThoughtChallenge
  readonly test?: ThoughtTest
}

/** A thought record, with the belief, challenge and test a test needs to look at. */
export function thoughtWith(
  createdAt: number,
  { thought = 'a thought', belief = 8, challenge, test }: ThoughtOptions = {},
  id = createdAt,
): ThoughtRecord {
  return {
    id,
    createdAt,
    emotions: [{ emotion: 'anxious', intensity: 5 }],
    thought,
    belief,
    ...(challenge !== undefined && { challenge }),
    ...(test !== undefined && { test }),
  }
}

/** A thought record that names the given emotions, all rated the same. */
export function thoughtRecordAt(
  createdAt: number,
  names: readonly Emotion[],
  id = createdAt,
): ThoughtRecord {
  return {
    id,
    createdAt,
    emotions: names.map((emotion) => ({ emotion, intensity: 5 })),
    thought: 'a thought',
    belief: 5,
  }
}
