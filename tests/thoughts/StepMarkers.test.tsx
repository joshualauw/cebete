import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { addThoughtRecord, deleteThoughtRecord } from '@/thoughts/repository'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const TITLES = [
  'The situation',
  'Your feelings',
  'What you did',
  'Your thought',
  'How much you believe it',
  'When it happened',
]

const NEED_FEELINGS = 'Choose how you felt to continue.'
const NEED_THOUGHT = 'Write your thought to continue.'

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function marker(number: number): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) })
}

function blocked(number: number): boolean {
  return marker(number).getAttribute('aria-disabled') === 'true'
}

function openCapture(): void {
  renderWithProviders(<ThoughtsScreen />)
  fireEvent.click(screen.getByRole('button', { name: 'New thought record' }))
}

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function type(label: string, text: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } })
}

function choose(label: string): void {
  fireEvent.click(screen.getByRole('checkbox', { name: label }))
}

function heading(): HTMLElement {
  return within(screen.getByRole('region', { name: /thought record$/ })).getByRole('heading', {
    level: 2,
  })
}

function finishedNumbers(): number[] {
  return [1, 2, 3, 4, 5, 6].filter((number) => marker(number).hasAttribute('data-finished'))
}

describe('step markers in a new record', () => {
  it('shows six numbered markers named after their steps, in a list called Steps', () => {
    openCapture()

    const list = screen.getByRole('list', { name: 'Steps' })

    expect(within(list).getAllByRole('listitem')).toHaveLength(6)
    TITLES.forEach((title, index) => {
      expect(marker(index + 1)).toHaveAccessibleName(`Step ${String(index + 1)}: ${title}`)
      expect(marker(index + 1)).toHaveTextContent(String(index + 1))
    })
  })

  it('marks only the current step as current, and follows the user from step to step', () => {
    openCapture()

    expect(marker(1)).toHaveAttribute('aria-current', 'step')
    expect(marker(2)).not.toHaveAttribute('aria-current')

    advance()

    expect(marker(1)).not.toHaveAttribute('aria-current')
    expect(marker(2)).toHaveAttribute('aria-current', 'step')
  })

  it('fills the markers of the steps the user has been through, and only while they are valid', () => {
    openCapture()

    expect(finishedNumbers()).toEqual([])

    advance()
    choose('Calm')
    advance()
    advance()

    expect(finishedNumbers()).toEqual([1, 2, 3])

    fireEvent.click(marker(2))
    choose('Calm')

    expect(finishedNumbers()).toEqual([1, 3])
  })

  it('lets the user go back to any earlier step, keeping everything typed', () => {
    openCapture()
    type('What was happening?', 'at the meeting')
    advance()
    choose('Sad')
    advance()
    type('What did you do?', 'went quiet')
    advance()
    type('What went through your mind?', 'I will fail')
    advance()

    fireEvent.click(marker(1))

    expect(heading()).toHaveTextContent('The situation')
    expect(screen.getByLabelText('What was happening?')).toHaveValue('at the meeting')

    fireEvent.click(marker(3))

    expect(screen.getByLabelText('What did you do?')).toHaveValue('went quiet')
  })

  it('moves focus to the heading of the step it jumps to', () => {
    openCapture()
    advance()
    choose('Sad')
    advance()
    advance()

    fireEvent.click(marker(1))

    expect(heading()).toHaveTextContent('The situation')
    expect(heading()).toHaveFocus()
  })

  it('keeps Back and Next working next to the markers', () => {
    openCapture()
    advance()
    choose('Sad')
    advance()
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(marker(2)).toHaveAttribute('aria-current', 'step')

    advance()

    expect(marker(3)).toHaveAttribute('aria-current', 'step')
  })
})

describe('step markers: the forward rule', () => {
  it('switches off the markers after the feelings until a feeling is chosen, and says what is needed', () => {
    openCapture()

    expect(blocked(1)).toBe(false)
    expect(blocked(2)).toBe(false)
    for (const number of [3, 4, 5, 6]) {
      expect(blocked(number)).toBe(true)
      expect(marker(number)).toHaveAccessibleDescription(NEED_FEELINGS)
    }
  })

  it('does nothing when a switched-off marker is tapped', () => {
    openCapture()
    fireEvent.click(marker(4))

    expect(heading()).toHaveTextContent('The situation')
    expect(marker(1)).toHaveAttribute('aria-current', 'step')
  })

  it('lets the user reach the feelings step itself without any feeling chosen yet', () => {
    openCapture()
    fireEvent.click(marker(2))

    expect(heading()).toHaveTextContent('Your feelings')
  })

  it('opens the steps up to the thought once a feeling is chosen, and the rest once a thought is written', () => {
    openCapture()
    advance()
    choose('Calm')

    expect(blocked(3)).toBe(false)
    expect(blocked(4)).toBe(false)
    for (const number of [5, 6]) {
      expect(blocked(number)).toBe(true)
      expect(marker(number)).toHaveAccessibleDescription(NEED_THOUGHT)
    }

    fireEvent.click(marker(4))
    type('What went through your mind?', 'a thought')

    for (const number of [1, 2, 3, 4, 5, 6]) {
      expect(blocked(number)).toBe(false)
    }
  })

  it('does not count a thought of only spaces', () => {
    openCapture()
    advance()
    choose('Calm')
    fireEvent.click(marker(4))
    type('What went through your mind?', '    ')

    expect(blocked(5)).toBe(true)
  })

  it('switches the later markers off again when the feelings are cleared', () => {
    openCapture()
    advance()
    choose('Calm')

    expect(blocked(3)).toBe(false)

    choose('Calm')

    expect(blocked(3)).toBe(true)
    expect(blocked(6)).toBe(true)
  })

  it('switches the later markers off again when the thought is cleared', () => {
    openCapture()
    advance()
    choose('Calm')
    fireEvent.click(marker(4))
    type('What went through your mind?', 'a thought')

    expect(blocked(6)).toBe(false)

    type('What went through your mind?', '')

    expect(blocked(5)).toBe(true)
    expect(blocked(6)).toBe(true)
  })

  it('lets the user jump straight to the last step once the required steps are filled, and still save', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(new Date(2026, 5, 10, 14, 35).getTime())
    openCapture()
    advance()
    choose('Calm')
    fireEvent.click(marker(4))
    type('What went through your mind?', 'jumped here')
    fireEvent.click(marker(6))

    expect(heading()).toHaveTextContent('When it happened')

    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(async () => {
      expect(await db.thoughtRecords.count()).toBe(1)
    })
    expect((await db.thoughtRecords.toArray())[0]).toMatchObject({
      thought: 'jumped here',
      belief: 5,
    })
  })
})

describe('step markers in an edit', () => {
  const OLDER = new Date(2020, 0, 1, 9, 0, 30, 456).getTime()

  async function openEdit(): Promise<number> {
    const saved = await addThoughtRecord({
      ...newThought({ situation: 'Team meeting', thought: 'I will fail', belief: 8 }),
      createdAt: OLDER,
    })

    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /^Edit the thought record/ }))

    return saved.id
  }

  it('makes every step reachable at once, and shows every other step as finished', async () => {
    await openEdit()

    for (const number of [1, 2, 3, 4, 5, 6]) {
      expect(blocked(number)).toBe(false)
    }
    expect(finishedNumbers()).toEqual([2, 3, 4, 5, 6])
  })

  it('goes from the first step straight to the thought in one tap, so only the thought is changed', async () => {
    const id = await openEdit()
    const before = await db.thoughtRecords.get(id)

    fireEvent.click(marker(4))

    expect(heading()).toHaveTextContent('Your thought')
    expect(heading()).toHaveFocus()

    type('What went through your mind?', 'I might cope')
    fireEvent.click(marker(6))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(async () => {
      expect((await db.thoughtRecords.get(id))?.thought).toBe('I might cope')
    })
    expect(await db.thoughtRecords.get(id)).toEqual({ ...before, thought: 'I might cope' })
  })

  it('still blocks the later markers if the user empties a required answer in the edit', async () => {
    await openEdit()
    fireEvent.click(marker(2))
    choose('Anxious')

    expect(blocked(3)).toBe(true)
    expect(marker(3)).toHaveAccessibleDescription(NEED_FEELINGS)
  })
})

describe('step markers: when they are hidden', () => {
  it('hides them while the discard question is open, and shows them again after Keep editing', () => {
    openCapture()
    type('What was happening?', 'something')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('list', { name: 'Steps' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Step 1:/ })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(screen.getByRole('list', { name: 'Steps' })).toBeInTheDocument()
    expect(marker(1)).toHaveAttribute('aria-current', 'step')
    expect(screen.getByLabelText('What was happening?')).toHaveValue('something')
  })

  it('hides them when the record being edited no longer exists', async () => {
    const saved = await addThoughtRecord({ ...newThought(), createdAt: 1_000 })

    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(await screen.findByRole('button', { name: /^Edit the thought record/ }))
    fireEvent.click(marker(6))
    await deleteThoughtRecord(saved.id)

    await waitFor(() => {
      expect(screen.queryByRole('list', { name: 'Steps' })).not.toBeInTheDocument()
    })
  })
})
