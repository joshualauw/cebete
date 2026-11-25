import type { EmotionRating } from '@/mood/types'

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
}

export type ThoughtRecord = NewThoughtRecord & {
  readonly id: number
  /** When it happened, in milliseconds since 1970. */
  readonly createdAt: number
  /** Present once the thought has been challenged. */
  readonly challenge?: ThoughtChallenge
}
