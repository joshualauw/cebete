import type { Emotion } from '@/mood/emotions'
import type { NewMoodEntry } from '@/mood/types'

/** An entry with a single emotion and its rating, the simplest entry a test needs. */
export function oneEmotion(emotion: Emotion, intensity: number): NewMoodEntry {
  return { emotions: [{ emotion, intensity }] }
}
