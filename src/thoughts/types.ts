import type { EmotionRating } from '@/mood/types'

import type { BodyNote } from './body'

export const BELIEF_MIN = 0
export const BELIEF_MAX = 10
export const BELIEF_DEFAULT = 5

export const TEXT_MAX_LENGTH = 500

/** What the user writes in a thought record, without the time it happened. */
export type NewThoughtRecord = {
  readonly situation?: string
  readonly emotions: readonly EmotionRating[]
  readonly action?: string
  readonly thought: string
  /** How strongly the thought is believed, a whole number from BELIEF_MIN to BELIEF_MAX. */
  readonly belief: number
}

/** A record to add. Without a time, it is stamped with the moment it is saved. */
export type NewThoughtRecordInput = NewThoughtRecord & {
  readonly createdAt?: number
}

/** A record as edited: everything in it, including when it happened. */
export type ThoughtRecordChanges = NewThoughtRecord & {
  readonly createdAt: number
}

/** Testing a thought: the evidence, a balanced thought, and how things stand afterwards. */
export type ThoughtChallenge = {
  readonly evidenceFor?: string
  readonly evidenceAgainst?: string
  readonly balanced: string
  /** How strongly the original thought is believed now. */
  readonly belief: number
  /** The record's own emotions, re-rated, in the same order as in the record. */
  readonly emotions: readonly EmotionRating[]
  /** When this version of the challenge was saved. Challenges saved before dates existed have none. */
  readonly challengedAt?: number
}

/**
 * Testing a thought in real life. It is planned first, then done once the result is logged, so
 * a half-filled test cannot exist.
 */
export type ThoughtTest =
  | {
      readonly status: 'planned'
      /** How and when the thought will be tested. */
      readonly plan: string
      /** What would happen if the thought were true. */
      readonly prediction: string
    }
  | {
      readonly status: 'done'
      readonly plan: string
      readonly prediction: string
      /** What happened when it was tested. */
      readonly result: string
      /** How strongly the original thought is believed after the test. */
      readonly belief: number
      /** When the result was logged. Results logged before dates existed have none. */
      readonly testedAt?: number
    }

export type ThoughtRecord = NewThoughtRecord & {
  readonly id: number
  /** When it happened, in milliseconds since 1970. */
  readonly createdAt: number
  /** Present once the thought has been challenged. */
  readonly challenge?: ThoughtChallenge
  /** Present once a test of the thought has been planned. */
  readonly test?: ThoughtTest
  /** Where the body reacts to the thought. Absent when there are no notes. */
  readonly body?: readonly BodyNote[]
}
