import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ThoughtLine from '@/thoughts/ThoughtLine'
import { renderWithProviders } from '@tests/helpers/render'

const LONG_THOUGHT =
  'Everyone at the meeting noticed that I stumbled over my words and now they all think I am not good enough for this job'

describe('ThoughtLine', () => {
  it('shows the whole thought', () => {
    renderWithProviders(<ThoughtLine thought={LONG_THOUGHT} />)

    expect(screen.getByText(LONG_THOUGHT)).toBeVisible()
  })

  it('lets a long thought wrap instead of cutting it off', () => {
    renderWithProviders(<ThoughtLine thought={LONG_THOUGHT} />)

    const style = getComputedStyle(screen.getByText(LONG_THOUGHT))

    expect(style.whiteSpace).not.toBe('nowrap')
    expect(style.textOverflow).not.toBe('ellipsis')
    expect(style.overflow).not.toBe('hidden')
  })
})
