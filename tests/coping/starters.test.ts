import { describe, expect, it } from 'vitest'

import { STARTER_TECHNIQUES } from '@/coping/starters'

describe('STARTER_TECHNIQUES', () => {
  it('offers slow breathing, grounding and muscle relaxation', () => {
    expect(STARTER_TECHNIQUES.map((technique) => technique.id)).toEqual([
      'slow-breathing',
      'grounding',
      'muscle-relaxation',
    ])
  })

  it('gives every technique a title and a few real steps', () => {
    for (const technique of STARTER_TECHNIQUES) {
      expect(technique.title.trim()).not.toBe('')
      expect(technique.steps.length).toBeGreaterThanOrEqual(3)
      expect(technique.steps.every((step) => step.trim() !== '')).toBe(true)
    }
  })

  it('has no repeated ids or titles, so each technique can be told apart', () => {
    const ids = STARTER_TECHNIQUES.map((technique) => technique.id)
    const titles = STARTER_TECHNIQUES.map((technique) => technique.title)

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('has no repeated step inside a technique, since each step is used as a list key', () => {
    for (const technique of STARTER_TECHNIQUES) {
      expect(new Set(technique.steps).size).toBe(technique.steps.length)
    }
  })
})
