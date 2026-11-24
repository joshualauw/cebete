/**
 * The emotions a mood entry can name, a mix of pleasant and unpleasant ones.
 * A preset list (not free text) keeps later trends consistent.
 */
export const emotions = [
  'calm',
  'happy',
  'grateful',
  'hopeful',
  'content',
  'tired',
  'sad',
  'anxious',
  'stressed',
  'angry',
  'lonely',
  'overwhelmed',
] as const

export type Emotion = (typeof emotions)[number]

export function isEmotion(value: unknown): value is Emotion {
  return emotions.some((emotion) => emotion === value)
}

/** The emotion as shown to the user, for example "Anxious". */
export function emotionLabel(emotion: Emotion): string {
  return emotion.charAt(0).toUpperCase() + emotion.slice(1)
}
