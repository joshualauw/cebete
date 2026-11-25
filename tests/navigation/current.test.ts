import { describe, expect, it } from 'vitest'

import { isCurrentSection } from '@/navigation/current'
import { paths } from '@/navigation/paths'

describe('isCurrentSection', () => {
  it.each([
    [paths.home, '/'],
    [paths.mood, '/mood'],
    [paths.thoughts, '/thoughts'],
    [paths.settings, '/settings'],
  ])('marks %s as current on its own address', (item, pathname) => {
    expect(isCurrentSection(item, pathname)).toBe(true)
  })

  it('keeps a section current below its address, such as one thought record', () => {
    expect(isCurrentSection(paths.thoughts, '/thoughts/7')).toBe(true)
  })

  it('does not mistake a longer name for a section below it', () => {
    expect(isCurrentSection(paths.mood, '/moodboard')).toBe(false)
  })

  it('ignores a trailing slash and capital letters, as the router does', () => {
    expect(isCurrentSection(paths.mood, '/Mood/')).toBe(true)
    expect(isCurrentSection(paths.home, '')).toBe(true)
  })

  it.each([paths.mood, paths.thoughts, paths.settings])(
    'does not mark Home as current on %s',
    (pathname) => {
      expect(isCurrentSection(paths.home, pathname)).toBe(false)
    },
  )

  it('keeps Home current on the coping library, and below it', () => {
    expect(isCurrentSection(paths.home, paths.coping)).toBe(true)
    expect(isCurrentSection(paths.home, `${paths.coping}/anything`)).toBe(true)
  })

  it('keeps Home current on the settle screen, and below it', () => {
    expect(isCurrentSection(paths.home, paths.settle)).toBe(true)
    expect(isCurrentSection(paths.home, `${paths.settle}/anything`)).toBe(true)
  })

  it.each([paths.mood, paths.thoughts, paths.settings])(
    'does not mark %s as current on the settle screen',
    (item) => {
      expect(isCurrentSection(item, paths.settle)).toBe(false)
    },
  )

  it('does not treat a longer name as the settle screen', () => {
    expect(isCurrentSection(paths.home, '/settled')).toBe(false)
  })

  it('does not treat a longer name as the coping library', () => {
    expect(isCurrentSection(paths.home, '/copingtips')).toBe(false)
  })

  it.each([paths.mood, paths.thoughts, paths.settings])(
    'does not mark %s as current on the coping library',
    (item) => {
      expect(isCurrentSection(item, paths.coping)).toBe(false)
    },
  )
})
