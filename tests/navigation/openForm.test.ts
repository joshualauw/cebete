import { describe, expect, it } from 'vitest'

import { openFormRequest, wantsOpenForm } from '@/navigation/openForm'

describe('the open-the-form request', () => {
  it('is understood when it is read back', () => {
    expect(wantsOpenForm(openFormRequest)).toBe(true)
    expect(wantsOpenForm({ openForm: true })).toBe(true)
  })

  it('is still understood next to other notes the history entry carries', () => {
    expect(wantsOpenForm({ openForm: true, fromRecord: 4 })).toBe(true)
  })

  it.each([
    ['nothing', undefined],
    ['null', null],
    ['a string', 'openForm'],
    ['a number', 1],
    ['an empty object', {}],
    ['the flag set to false', { openForm: false }],
    ['the flag as text', { openForm: 'true' }],
    ['the flag as a number', { openForm: 1 }],
    ['another note', { deleted: true }],
  ])('is not asked for by %s', (_label, state) => {
    expect(wantsOpenForm(state)).toBe(false)
  })
})
