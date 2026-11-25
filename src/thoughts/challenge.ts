import type { EmotionRating } from '@/mood/types'

import type { ThoughtChallenge } from './types'

/** Whether two lists name exactly the same emotions, whatever their order or ratings. */
export function sameEmotions(
  first: readonly EmotionRating[],
  second: readonly EmotionRating[],
): boolean {
  return (
    first.length === second.length &&
    first.every(({ emotion }) => second.some((other) => other.emotion === emotion))
  )
}

/**
 * Follows a change of the record's feelings: emotions that remain keep the rating from the
 * challenge, new ones start at their rating in the record, and removed ones are dropped.
 */
export function reconcileChallenge(
  challenge: ThoughtChallenge,
  emotions: readonly EmotionRating[],
): ThoughtChallenge {
  return {
    ...challenge,
    emotions: emotions.map(
      (rating) => challenge.emotions.find(({ emotion }) => emotion === rating.emotion) ?? rating,
    ),
  }
}
