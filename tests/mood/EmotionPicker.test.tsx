import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import EmotionPicker from '@/mood/EmotionPicker'
import { type Emotion, emotionLabel, emotions } from '@/mood/emotions'
import { MAX_EMOTIONS } from '@/mood/types'
import { renderWithProviders } from '@tests/helpers/render'

function renderPicker(
  selected: readonly Emotion[] = [],
  onToggle: (emotion: Emotion) => void = () => undefined,
): void {
  renderWithProviders(<EmotionPicker selected={selected} onToggle={onToggle} />)
}

describe('EmotionPicker', () => {
  it('is a labelled group with one checkbox per emotion', () => {
    renderPicker()

    const group = screen.getByRole('group', { name: 'How are you feeling?' })
    const boxes = screen.getAllByRole('checkbox')

    expect(group).toBeInTheDocument()
    expect(boxes.map((box) => box.getAttribute('value'))).toEqual([...emotions])
    for (const emotion of emotions) {
      expect(screen.getByRole('checkbox', { name: emotionLabel(emotion) })).toBeInTheDocument()
    }
  })

  it('says how many can be chosen', () => {
    renderPicker()

    expect(screen.getByText(`Choose up to ${String(MAX_EMOTIONS)}.`)).toBeInTheDocument()
  })

  it('has nothing chosen when nothing is selected', () => {
    renderPicker([])

    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).not.toBeChecked()
    }
  })

  it('shows the selected emotions as chosen, and only those', () => {
    renderPicker(['sad', 'hopeful'])

    expect(screen.getByRole('checkbox', { name: 'Sad' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Hopeful' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Calm' })).not.toBeChecked()
  })

  it('reports each emotion the user taps, whether to choose it or to remove it', () => {
    const onToggle = vi.fn()
    renderPicker(['calm'], onToggle)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
    fireEvent.click(screen.getByRole('checkbox', { name: 'Calm' }))

    expect(onToggle).toHaveBeenNthCalledWith(1, 'anxious')
    expect(onToggle).toHaveBeenNthCalledWith(2, 'calm')
  })
})

describe('EmotionPicker: the limit', () => {
  const full: readonly Emotion[] = ['calm', 'happy', 'sad']

  it('keeps every emotion available below the limit, with no message', () => {
    renderPicker(['calm', 'happy'])

    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toBeEnabled()
    }
    expect(screen.queryByText(/most you can choose/i)).not.toBeInTheDocument()
  })

  it('switches off the emotions not chosen once the limit is reached', () => {
    renderPicker(full)

    expect(full).toHaveLength(MAX_EMOTIONS)
    expect(screen.getByRole('checkbox', { name: 'Tired' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Angry' })).toBeDisabled()
  })

  it('keeps the chosen emotions available, so any of them can be removed', () => {
    renderPicker(full)

    for (const label of ['Calm', 'Happy', 'Sad']) {
      expect(screen.getByRole('checkbox', { name: label })).toBeEnabled()
    }
  })

  it('explains the limit in a calm message that is announced politely', () => {
    renderPicker(full)

    const message = screen.getByText(/most you can choose/i)

    expect(message).toHaveTextContent(/remove one/i)
    expect(message).toHaveAttribute('aria-live', 'polite')
  })

  it('keeps the message on the page even when empty, so it is announced when it appears', () => {
    const { container } = renderWithProviders(
      <EmotionPicker selected={[]} onToggle={() => undefined} />,
    )

    expect(container.querySelector('[aria-live="polite"]')).toBeEmptyDOMElement()
  })
})
