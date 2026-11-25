import { describe, expect, it } from 'vitest'

import { paths, thoughtRecordPath } from '@/navigation/paths'

describe('paths', () => {
  it('puts the coping library at its own address', () => {
    expect(paths.coping).toBe('/coping')
  })

  it('puts the quick settle screen at its own address', () => {
    expect(paths.settle).toBe('/settle')
  })
})

describe('thoughtRecordPath', () => {
  it('builds the address of one record below Thoughts', () => {
    expect(thoughtRecordPath(7)).toBe('/thoughts/7')
  })

  it('matches the pattern the router uses for a record', () => {
    expect(paths.thoughtRecord).toBe('/thoughts/:id')
  })
})
