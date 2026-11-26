import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { ReactElement } from 'react'
import { useNavigate } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import App from '@/App'
import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import { LocationProbe } from '@tests/helpers/locationProbe'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

/** Stands in for the browser's Back button. */
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

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
})

function renderApp(route = '/'): void {
  renderWithProviders(
    <>
      <App />
      <LocationProbe />
      <BrowserBack />
    </>,
    route,
  )
}

function bar(): HTMLElement {
  return screen.getByRole('navigation', { name: 'Main' })
}

describe('Home quick actions: Log how I feel', () => {
  it('opens Mood with the new-entry form ready, and Mood highlighted in the bar', async () => {
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'Log how I feel' }))

    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/mood$/)
    expect(screen.getByRole('heading', { level: 1, name: 'Mood' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'New entry' })).toHaveFocus()
    expect(within(bar()).getByRole('link', { name: 'Mood' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(bar()).getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
    await screen.findByText(/no entries yet/i)
  })

  it('keeps the user on Mood with its list when the form is cancelled', async () => {
    await addMoodEntry(oneEmotion('hopeful', 6))
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'Log how I feel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/mood$/)
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
    expect(await screen.findByText('Hopeful')).toBeInTheDocument()
  })

  it('goes back to Home with one tap of Back, and does not open the form there again', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Log how I feel' }))
    await waitFor(() => {
      expect(screen.getByTestId('history-note')).toHaveTextContent('null')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))

    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
  })

  it('does not reopen the form when Mood is opened from the bar afterwards', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Log how I feel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    fireEvent.click(within(bar()).getByRole('link', { name: 'Home' }))
    fireEvent.click(within(bar()).getByRole('link', { name: 'Mood' }))

    expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()
    await screen.findByText(/no entries yet/i)
  })
})

describe('Home quick actions: Write down a thought', () => {
  it('opens Thoughts with the guided capture ready, and Thoughts highlighted in the bar', async () => {
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'Write down a thought' }))

    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/thoughts$/)
    expect(screen.getByRole('heading', { level: 1, name: 'Thoughts' })).toBeInTheDocument()

    const capture = screen.getByRole('region', { name: 'New thought record' })

    expect(within(capture).getByText(/Step 1 of 6/)).toBeInTheDocument()
    expect(within(capture).getByRole('heading', { level: 2 })).toHaveFocus()
    expect(within(bar()).getByRole('link', { name: 'Thoughts' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    await screen.findByText(/no thought records yet/i)
  })

  it('keeps the user on Thoughts with its list when the capture is cancelled', async () => {
    renderApp()

    fireEvent.click(screen.getByRole('link', { name: 'Write down a thought' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/thoughts$/)
    expect(screen.getByRole('button', { name: 'New thought record' })).toBeInTheDocument()
    expect(await screen.findByText(/no thought records yet/i)).toBeInTheDocument()
  })

  it('goes back to Home with one tap of Back', async () => {
    renderApp()
    fireEvent.click(screen.getByRole('link', { name: 'Write down a thought' }))
    await waitFor(() => {
      expect(screen.getByTestId('history-note')).toHaveTextContent('null')
    })

    fireEvent.click(screen.getByRole('button', { name: 'Browser back' }))

    expect(screen.getByTestId('pathname')).toHaveTextContent(/^\/$/)
    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
  })
})

describe('the sections opened in the ordinary ways', () => {
  it.each([
    ['/mood', 'Mood', 'Add entry'],
    ['/thoughts', 'Thoughts', 'New thought record'],
  ])('show no form when %s is opened by its address', async (route, heading, button) => {
    renderApp(route)

    expect(screen.getByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: button })).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'New entry' })).not.toBeInTheDocument()
    })
  })

  it('show no form when opened from the bottom bar', () => {
    renderApp()

    fireEvent.click(within(bar()).getByRole('link', { name: 'Mood' }))
    expect(screen.getByRole('button', { name: 'Add entry' })).toBeInTheDocument()

    fireEvent.click(within(bar()).getByRole('link', { name: 'Thoughts' }))
    expect(screen.getByRole('button', { name: 'New thought record' })).toBeInTheDocument()
  })
})
