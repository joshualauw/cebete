import { describe, expect, it } from 'vitest'

import { DEFAULT_RANGE_DAYS, RANGE_DAYS, rangeStart } from '@/insights/range'
import { localMoment } from '@tests/helpers/insights'

describe('the ranges on offer', () => {
  it('are 7 and 30 days, and the summary starts on 7', () => {
    expect([...RANGE_DAYS]).toEqual([7, 30])
    expect(DEFAULT_RANGE_DAYS).toBe(7)
  })
})

describe('rangeStart', () => {
  it('begins at the start of the local day, 6 days before today, for 7 days', () => {
    const now = localMoment(2026, 6, 10, 15, 30)

    expect(rangeStart(now, 7)).toBe(new Date(2026, 5, 4).getTime())
  })

  it('begins at the start of the local day, 29 days before today, for 30 days', () => {
    const now = localMoment(2026, 6, 10, 15, 30)

    expect(rangeStart(now, 30)).toBe(new Date(2026, 4, 12).getTime())
  })

  it('counts today as one of the days: a range of 1 day is today alone', () => {
    const now = localMoment(2026, 6, 10, 15, 30)

    expect(rangeStart(now, 1)).toBe(new Date(2026, 5, 10).getTime())
  })

  it('is the same at the very start and the very end of a day', () => {
    const first = new Date(2026, 5, 10, 0, 0, 0, 0).getTime()
    const last = new Date(2026, 5, 10, 23, 59, 59, 999).getTime()

    expect(rangeStart(first, 7)).toBe(rangeStart(last, 7))
    expect(rangeStart(first, 7)).toBe(new Date(2026, 5, 4).getTime())
  })

  it('moves to the next day as soon as the day changes', () => {
    const before = new Date(2026, 5, 10, 23, 59, 59, 999).getTime()
    const after = new Date(2026, 5, 11, 0, 0, 0, 0).getTime()

    expect(rangeStart(after, 7) - rangeStart(before, 7)).toBeGreaterThan(0)
    expect(rangeStart(after, 7)).toBe(new Date(2026, 5, 5).getTime())
  })

  it('crosses a month change', () => {
    expect(rangeStart(localMoment(2026, 3, 2), 7)).toBe(new Date(2026, 1, 24).getTime())
  })

  it('crosses a year change', () => {
    expect(rangeStart(localMoment(2026, 1, 3), 7)).toBe(new Date(2025, 11, 28).getTime())
  })

  it('counts the days of a leap year', () => {
    expect(rangeStart(localMoment(2028, 3, 3), 7)).toBe(new Date(2028, 1, 26).getTime())
  })

  it('counts calendar days across a clock change, whatever time zone this runs in', () => {
    // The clocks change in many places in March, so 7 days can hold 6 days 23 hours of time.
    const now = localMoment(2026, 3, 12, 12, 0)
    const start = new Date(rangeStart(now, 7))

    expect(start.getFullYear()).toBe(2026)
    expect(start.getMonth()).toBe(2)
    expect(start.getDate()).toBe(6)
    expect([start.getHours(), start.getMinutes(), start.getSeconds()]).toEqual([0, 0, 0])
  })

  it('always begins at a local midnight', () => {
    for (const days of RANGE_DAYS) {
      const start = new Date(rangeStart(localMoment(2026, 11, 1, 18, 45), days))

      expect([
        start.getHours(),
        start.getMinutes(),
        start.getSeconds(),
        start.getMilliseconds(),
      ]).toEqual([0, 0, 0, 0])
    }
  })
})
