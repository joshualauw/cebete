import { describe, expect, it } from 'vitest'

import { formatEntryTime } from '@/mood/format'

describe('formatEntryTime', () => {
  const timestamp = new Date(2026, 10, 24, 15, 5).getTime()

  it('shows the date and the time of day', () => {
    const text = formatEntryTime(timestamp)

    // The exact wording depends on the user's language, but the day, year and time always show.
    expect(text).toContain('24')
    expect(text).toContain('2026')
    expect(text).toMatch(/3:05|15[:.]05/)
  })

  it('gives different text for different times', () => {
    expect(formatEntryTime(timestamp)).not.toBe(formatEntryTime(timestamp + 60 * 60 * 1000))
  })
})
