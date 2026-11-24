import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EmotionRatings from '@/mood/EmotionRatings'
import type { EmotionRating } from '@/mood/types'
import { renderWithProviders } from '@tests/helpers/render'

const ratings: readonly EmotionRating[] = [
  { emotion: 'sad', intensity: 2 },
  { emotion: 'anxious', intensity: 7 },
]

describe('EmotionRatings', () => {
  it('shows nothing when no emotion is chosen', () => {
    renderWithProviders(<EmotionRatings ratings={[]} onChange={() => undefined} />)

    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('slider')).toHaveLength(0)
  })

  it('gives each chosen emotion its own labelled 0 to 10 slider, in the order chosen', () => {
    renderWithProviders(<EmotionRatings ratings={ratings} onChange={() => undefined} />)

    const sliders = screen.getAllByRole('slider')

    expect(screen.getByRole('group', { name: 'How strong is each feeling?' })).toBeInTheDocument()
    expect(sliders).toHaveLength(2)
    expect(
      screen.getAllByRole('slider').map((slider) => slider.getAttribute('aria-valuetext')),
    ).toEqual(['2 out of 10', '7 out of 10'])
    expect(screen.getByRole('slider', { name: 'Sad intensity' })).toHaveValue('2')
    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('7')
    for (const slider of sliders) {
      expect(slider).toHaveAttribute('min', '0')
      expect(slider).toHaveAttribute('max', '10')
    }
  })

  it('always shows each number, out of 10', () => {
    renderWithProviders(<EmotionRatings ratings={ratings} onChange={() => undefined} />)

    expect(screen.getByText('2/10')).toBeInTheDocument()
    expect(screen.getByText('7/10')).toBeInTheDocument()
  })

  it('reports which emotion was rated, and the new rating', () => {
    const onChange = vi.fn()
    renderWithProviders(<EmotionRatings ratings={ratings} onChange={onChange} />)

    fireEvent.change(screen.getByRole('slider', { name: 'Anxious intensity' }), {
      target: { value: '9' },
    })

    expect(onChange).toHaveBeenCalledExactlyOnceWith('anxious', 9)
  })
})
