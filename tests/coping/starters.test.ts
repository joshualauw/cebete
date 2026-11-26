import { describe, expect, it } from 'vitest'

import { STARTER_TECHNIQUES, starterItems } from '@/coping/starters'
import { DETAIL_MAX_LENGTH, TEXT_MAX_LENGTH } from '@/coping/types'
import { isCopingItem, validateNewCopingItem } from '@/coping/validation'

describe('STARTER_TECHNIQUES', () => {
  it('offers slow breathing, grounding and muscle relaxation, in that order', () => {
    expect(STARTER_TECHNIQUES.map((technique) => technique.title)).toEqual([
      'Slow breathing',
      'Grounding: 5, 4, 3, 2, 1',
      'Muscle relaxation',
    ])
  })

  it('gives every technique a few real steps', () => {
    for (const technique of STARTER_TECHNIQUES) {
      expect(technique.steps.length).toBeGreaterThanOrEqual(3)
      expect(technique.steps.every((step) => step.trim() !== '')).toBe(true)
    }
  })

  it('has no repeated title, so each technique can be told apart', () => {
    const titles = STARTER_TECHNIQUES.map((technique) => technique.title)

    expect(new Set(titles).size).toBe(titles.length)
  })
})

describe('starterItems', () => {
  it('makes one "Do" item for each technique, with its name as the text', () => {
    const items = starterItems()

    expect(items).toHaveLength(STARTER_TECHNIQUES.length)
    expect(items.map((item) => item.type)).toEqual(['do', 'do', 'do'])
    expect(items.map((item) => item.text)).toEqual(STARTER_TECHNIQUES.map(({ title }) => title))
  })

  it('numbers the steps, one to a line, in the detail', () => {
    for (const [index, item] of starterItems().entries()) {
      const steps = STARTER_TECHNIQUES[index]?.steps ?? []
      const lines = (item.detail ?? '').split('\n')

      expect(lines).toHaveLength(steps.length)
      expect(lines).toEqual(steps.map((step, number) => `${String(number + 1)}. ${step}`))
    }
  })

  it('passes the same checks as any item the user adds', () => {
    for (const item of starterItems()) {
      expect(validateNewCopingItem(item)).toEqual(item)
      expect(isCopingItem({ ...item, id: 1 })).toBe(true)
    }
  })

  it('fits the length limits, with the longest detail under 500 characters', () => {
    for (const item of starterItems()) {
      expect(item.text.length).toBeLessThanOrEqual(TEXT_MAX_LENGTH)
      expect((item.detail ?? '').length).toBeLessThanOrEqual(DETAIL_MAX_LENGTH)
    }
    expect(Math.max(...starterItems().map((item) => (item.detail ?? '').length))).toBeLessThan(500)
  })

  it('gives the same items every time, so a new database always starts the same', () => {
    expect(starterItems()).toEqual(starterItems())
  })
})
