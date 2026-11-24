import { describe, expect, it } from 'vitest'

import { emotionLabel, emotions, isEmotion } from '@/mood/emotions'

describe('emotions', () => {
  it('offers a mix of pleasant and unpleasant emotions', () => {
    expect(emotions).toEqual(expect.arrayContaining(['calm', 'happy', 'sad', 'anxious']))
  })

  it('has no duplicates', () => {
    expect(new Set(emotions).size).toBe(emotions.length)
  })

  it.each(emotions)('recognises %s', (emotion) => {
    expect(isEmotion(emotion)).toBe(true)
  })

  it.each([undefined, null, '', 'bogus', 'CALM', 5, {}])('rejects %j', (value) => {
    expect(isEmotion(value)).toBe(false)
  })
})

describe('emotionLabel', () => {
  it.each([
    ['calm', 'Calm'],
    ['overwhelmed', 'Overwhelmed'],
  ] as const)('shows %s as %s', (emotion, label) => {
    expect(emotionLabel(emotion)).toBe(label)
  })

  it('gives every emotion a label that starts with a capital letter', () => {
    for (const emotion of emotions) {
      expect(emotionLabel(emotion)).toMatch(/^[A-Z][a-z]+$/)
    }
  })
})
