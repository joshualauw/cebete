import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { db } from '@/db/db'
import { formatEntryTime } from '@/mood/format'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import {
  addThoughtRecord,
  saveThoughtBody,
  saveThoughtChallenge,
  saveThoughtTest,
} from '@/thoughts/repository'
import type { NewThoughtRecord } from '@/thoughts/types'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const FIRST = new Date(2020, 0, 1, 9, 0).getTime()
const SECOND = new Date(2020, 0, 2, 9, 0).getTime()

async function addAt(time: number, record: NewThoughtRecord = newThought()): Promise<number> {
  return (await addThoughtRecord({ ...record, createdAt: time })).id
}

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function cards(): HTMLElement[] {
  return screen.getAllByRole('listitem')
}

/** Goes back one step in history, as the browser's back button does. */
function BrowserBack(): ReactElement {
  const navigate = useNavigate()

  return (
    <button
      type="button"
      onClick={() => {
        void navigate(-1)
      }}
    >
      Browser back
    </button>
  )
}

/** Shows where the app is and what the history entry carries. */
function Where(): ReactElement {
  const location = useLocation()
  const state: unknown = location.state

  return (
    <p data-testid="where">
      {location.pathname} {JSON.stringify(state)}
    </p>
  )
}

function renderApp(): void {
  renderWithProviders(
    <>
      <App />
      <BrowserBack />
      <Where />
    </>,
    '/thoughts',
  )
}

describe('ThoughtsScreen', () => {
  it('has the Thoughts heading and a calm line that it is not professional care', async () => {
    renderWithProviders(<ThoughtsScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'Thoughts' })).toBeInTheDocument()
    expect(screen.getByText(/not a substitute for professional care/i)).toBeInTheDocument()
    await screen.findByText(/no thought records yet/i)
  })

  it('shows a friendly empty state when there are no records', async () => {
    renderWithProviders(<ThoughtsScreen />)

    expect(
      await screen.findByRole('heading', { name: 'No thought records yet' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('shows nothing, not the empty state, while the first read is under way', () => {
    renderWithProviders(<ThoughtsScreen />)

    expect(screen.queryByText(/no thought records yet/i)).not.toBeInTheDocument()
  })
})

describe('ThoughtRecordList: a card', () => {
  it('shows the situation, the thought and the time, and no belief rating', async () => {
    await addAt(FIRST, newThought({ situation: 'Team meeting', thought: 'I will fail', belief: 8 }))
    renderWithProviders(<ThoughtsScreen />)

    const card = await screen.findByRole('listitem')
    const view = within(card)

    expect(view.getByText('Team meeting')).toBeInTheDocument()
    expect(view.getByText('I will fail')).toBeInTheDocument()
    expect(view.getByText(formatEntryTime(FIRST))).toBeInTheDocument()
    expect(view.queryByText('Belief in the thought')).not.toBeInTheDocument()
    expect(card).not.toHaveTextContent('8/10')
  })

  it('leaves the feelings and every action to the record’s own screen', async () => {
    await addAt(
      FIRST,
      newThought({
        emotions: [
          { emotion: 'anxious', intensity: 7 },
          { emotion: 'sad', intensity: 3 },
        ],
      }),
    )
    renderWithProviders(<ThoughtsScreen />)

    const card = await screen.findByRole('listitem')

    expect(card).not.toHaveTextContent('Anxious')
    expect(card).not.toHaveTextContent('Sad')
    expect(within(card).queryByRole('button')).not.toBeInTheDocument()
    expect(within(card).getAllByRole('link')).toHaveLength(1)
  })

  it('shows no situation line when the record has none', async () => {
    await addAt(FIRST, newThought({ thought: 'only a thought' }))
    renderWithProviders(<ThoughtsScreen />)

    const card = await screen.findByRole('listitem')

    expect(card.textContent).toContain('only a thought')
    expect(card.querySelectorAll('p')[0]).toHaveTextContent('only a thought')
  })

  it('shows no completed part, and no checkmark, on a thought that has not been challenged', async () => {
    await addAt(FIRST)
    renderWithProviders(<ThoughtsScreen />)

    const card = await screen.findByRole('listitem')

    expect(screen.queryByText('Challenged')).not.toBeInTheDocument()
    expect(card.querySelector('svg')).toBeNull()
  })

  it('shows Challenged with a checkmark on its left, and no belief rating, on a challenged thought', async () => {
    const id = await addAt(FIRST, newThought({ belief: 9 }))
    await saveThoughtChallenge(id, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
    renderWithProviders(<ThoughtsScreen />)

    const card = await screen.findByRole('listitem')
    const label = within(card).getByText('Challenged')
    const line = label.parentElement
    const icon = line?.querySelector('svg')

    expect(icon).not.toBeNull()
    expect(icon).toHaveAttribute('aria-hidden', 'true')
    expect(line?.firstElementChild).toBe(icon)
    expect(card).not.toHaveTextContent('→')
    expect(card).not.toHaveTextContent('Belief in the thought')
    expect(within(card).queryByText(/out of 10/)).not.toBeInTheDocument()
  })

  it('keeps the card one link, named after the thought and the time, with the label in it', async () => {
    const id = await addAt(FIRST, newThought({ thought: 'I will fail' }))
    await saveThoughtChallenge(id, {
      balanced: 'I can cope',
      belief: 4,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    })
    renderWithProviders(<ThoughtsScreen />)

    const link = await screen.findByRole('link', { name: /I will fail/ })

    expect(link).toHaveAccessibleName(new RegExp(formatEntryTime(FIRST)))
    expect(link).toHaveAccessibleName(/Challenged/)
  })

  describe('with a test', () => {
    const plannedTest = {
      status: 'planned',
      plan: 'Say hello to two people',
      prediction: 'Nobody will answer',
    } as const
    const doneTest = { ...plannedTest, status: 'done', result: 'Both answered', belief: 3 } as const

    it('shows nothing new for a planned test', async () => {
      const id = await addAt(FIRST)

      await saveThoughtTest(id, plannedTest)
      renderWithProviders(<ThoughtsScreen />)

      const card = await screen.findByRole('listitem')

      expect(card).not.toHaveTextContent('Tested')
      expect(card).not.toHaveTextContent('planned')
      expect(card.querySelector('svg')).toBeNull()
    })

    it('shows Tested with a decorative checkmark on its left, and no belief, once the result is logged', async () => {
      const id = await addAt(FIRST, newThought({ belief: 9 }))

      await saveThoughtTest(id, doneTest)
      renderWithProviders(<ThoughtsScreen />)

      const card = await screen.findByRole('listitem')
      const label = within(card).getByText('Tested')
      const icon = label.parentElement?.querySelector('svg')

      expect(icon).not.toBeNull()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(label.parentElement?.firstElementChild).toBe(icon)
      expect(card).not.toHaveTextContent('→')
      expect(card).not.toHaveTextContent('Belief in the thought')
      expect(within(card).queryByText('Challenged')).not.toBeInTheDocument()
    })

    it('shows both lines, Challenged first, for a record that is challenged and tested', async () => {
      const id = await addAt(FIRST)

      await saveThoughtChallenge(id, {
        balanced: 'I can cope',
        belief: 4,
        emotions: [{ emotion: 'anxious', intensity: 3 }],
      })
      await saveThoughtTest(id, doneTest)
      renderWithProviders(<ThoughtsScreen />)

      const card = await screen.findByRole('listitem')
      const challenged = within(card).getByText('Challenged')
      const tested = within(card).getByText('Tested')

      expect(card.querySelectorAll('svg')).toHaveLength(2)
      expect(
        challenged.compareDocumentPosition(tested) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
    })

    it('keeps the card one link, and its name includes Tested', async () => {
      const id = await addAt(FIRST, newThought({ thought: 'I will fail' }))

      await saveThoughtTest(id, doneTest)
      renderWithProviders(<ThoughtsScreen />)

      const link = await screen.findByRole('link', { name: /I will fail/ })

      expect(link).toHaveAccessibleName(/Tested/)
    })
  })

  describe('with body notes', () => {
    it('shows Body noted with a decorative checkmark on its left, and no other detail', async () => {
      const id = await addAt(FIRST)

      await saveThoughtBody(id, [{ area: 'chest', description: 'tight' }, { area: 'stomach' }])
      renderWithProviders(<ThoughtsScreen />)

      const card = await screen.findByRole('listitem')
      const label = within(card).getByText('Body noted')
      const icon = label.parentElement?.querySelector('svg')

      expect(icon).not.toBeNull()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
      expect(label.parentElement?.firstElementChild).toBe(icon)
      expect(card).not.toHaveTextContent('Chest')
      expect(card).not.toHaveTextContent('tight')
      expect(card).not.toHaveTextContent('Stomach')
    })

    it('shows nothing for a record with no notes', async () => {
      await addAt(FIRST)
      renderWithProviders(<ThoughtsScreen />)

      const card = await screen.findByRole('listitem')

      expect(card).not.toHaveTextContent('Body noted')
      expect(card.querySelector('svg')).toBeNull()
    })

    it('shows nothing once every note has been cleared', async () => {
      const id = await addAt(FIRST)

      await saveThoughtBody(id, [{ area: 'chest' }])
      await saveThoughtBody(id, [])
      renderWithProviders(<ThoughtsScreen />)

      const card = await screen.findByRole('listitem')

      expect(card).not.toHaveTextContent('Body noted')
    })

    it('shows all three lines, in order, for a challenged, tested and noted record', async () => {
      const id = await addAt(FIRST)

      await saveThoughtChallenge(id, {
        balanced: 'I can cope',
        belief: 4,
        emotions: [{ emotion: 'anxious', intensity: 3 }],
      })
      await saveThoughtTest(id, {
        status: 'done',
        plan: 'a plan',
        prediction: 'a guess',
        result: 'it went fine',
        belief: 3,
      })
      await saveThoughtBody(id, [{ area: 'head' }])
      renderWithProviders(<ThoughtsScreen />)

      const card = await screen.findByRole('listitem')
      const challenged = within(card).getByText('Challenged')
      const tested = within(card).getByText('Tested')
      const noted = within(card).getByText('Body noted')

      expect(card.querySelectorAll('svg')).toHaveLength(3)
      expect(
        challenged.compareDocumentPosition(tested) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy()
      expect(tested.compareDocumentPosition(noted) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('keeps the card one link, and its name includes Body noted', async () => {
      const id = await addAt(FIRST, newThought({ thought: 'I will fail' }))

      await saveThoughtBody(id, [{ area: 'chest' }])
      renderWithProviders(<ThoughtsScreen />)

      const link = await screen.findByRole('link', { name: /I will fail/ })

      expect(link).toHaveAccessibleName(/Body noted/)
    })
  })

  it('lists the records newest first', async () => {
    await addAt(FIRST, newThought({ thought: 'older one' }))
    await addAt(SECOND, newThought({ thought: 'newer one' }))
    renderWithProviders(<ThoughtsScreen />)

    await screen.findAllByRole('listitem')

    expect(cards()[0]).toHaveTextContent('newer one')
    expect(cards()[1]).toHaveTextContent('older one')
  })

  it('updates by itself when a record is added or removed in the background', async () => {
    renderWithProviders(<ThoughtsScreen />)
    await screen.findByText(/no thought records yet/i)

    await addAt(FIRST, newThought({ thought: 'arrived later' }))

    expect(await screen.findByText('arrived later')).toBeInTheDocument()
  })
})

describe('ThoughtRecordList: opening a record', () => {
  it('makes the whole card one link to the record, named after the thought and the time', async () => {
    const id = await addAt(FIRST, newThought({ thought: 'I will fail' }))
    renderApp()

    const link = await screen.findByRole('link', { name: /I will fail/ })

    expect(link).toHaveAttribute('href', `/thoughts/${String(id)}`)
    expect(link).toHaveAccessibleName(new RegExp(formatEntryTime(FIRST)))
    expect(link.closest('li')).toContainElement(link)
  })

  it('opens the record on its own screen when the card is tapped', async () => {
    const id = await addAt(FIRST, newThought({ thought: 'I will fail' }))
    renderApp()

    fireEvent.click(await screen.findByRole('link', { name: /I will fail/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Thought record' })).toBeVisible()
    expect(screen.getByTestId('where')).toHaveTextContent(`/thoughts/${String(id)}`)
    expect(
      within(screen.getByRole('region', { name: 'The thought' })).getByText('I will fail'),
    ).toBeInTheDocument()
  })

  it('returns focus to the card when the user comes back with Back to thoughts', async () => {
    await addAt(FIRST, newThought({ thought: 'older one' }))
    await addAt(SECOND, newThought({ thought: 'newer one' }))
    renderApp()

    fireEvent.click(await screen.findByRole('link', { name: /older one/ }))
    fireEvent.click(await screen.findByRole('link', { name: 'Back to thoughts' }))

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /older one/ })).toHaveFocus()
    })
  })

  it('returns focus to the card when the user comes back with the browser’s back button', async () => {
    await addAt(FIRST, newThought({ thought: 'older one' }))
    await addAt(SECOND, newThought({ thought: 'newer one' }))
    renderApp()

    fireEvent.click(await screen.findByRole('link', { name: /older one/ }))
    await screen.findByRole('heading', { level: 1, name: 'Thought record' })
    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /older one/ })).toHaveFocus()
    })
  })

  it('clears the note about which record was opened, so a reload does not move focus again', async () => {
    await addAt(FIRST, newThought({ thought: 'older one' }))
    renderApp()

    fireEvent.click(await screen.findByRole('link', { name: /older one/ }))
    fireEvent.click(await screen.findByRole('link', { name: 'Back to thoughts' }))
    await screen.findByRole('link', { name: /older one/ })

    await waitFor(() => {
      expect(screen.getByTestId('where')).toHaveTextContent(/^\/thoughts null$/)
    })
  })

  it('does not move focus when the list is opened any other way', async () => {
    await addAt(FIRST, newThought({ thought: 'older one' }))
    renderApp()

    const link = await screen.findByRole('link', { name: /older one/ })

    expect(link).not.toHaveFocus()
  })
})

describe('ThoughtRecordList: while a new record is being captured', () => {
  it('makes the cards inert, so typed work is never lost by a stray tap, and wakes them again after', async () => {
    await addAt(FIRST, newThought({ thought: 'I will fail' }))
    renderApp()

    const link = await screen.findByRole('link', { name: /I will fail/ })

    fireEvent.click(screen.getByRole('button', { name: 'New thought record' }))

    expect(link).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(link)

    expect(screen.getByRole('heading', { level: 1, name: 'Thoughts' })).toBeInTheDocument()
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/thoughts/)
    expect(screen.queryByRole('heading', { name: 'Thought record' })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /I will fail/ })).not.toHaveAttribute('aria-disabled')
    })
  })
})
