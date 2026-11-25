import { describe, expect, it } from 'vitest'

import { paths, thoughtRecordPath } from '@/navigation/paths'

describe('thoughtRecordPath', () => {
  it('builds the address of one record below Thoughts', () => {
    expect(thoughtRecordPath(7)).toBe('/thoughts/7')
  })

  it('matches the pattern the router uses for a record', () => {
    expect(paths.thoughtRecord).toBe('/thoughts/:id')
  })
})
