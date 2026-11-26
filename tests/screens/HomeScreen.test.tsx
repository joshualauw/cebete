import { fireEvent, screen } from '@testing-library/react'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import HomeScreen from '@/screens/HomeScreen'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

describe('HomeScreen: the backup reminder', () => {
  beforeEach(async () => {
    await db.moodEntries.clear()
  })

  it('shows no reminder to a new user', async () => {
    renderWithProviders(<HomeScreen />)

    await screen.findByRole('region', { name: 'Summary' })

    expect(screen.queryByRole('region', { name: 'Backup reminder' })).not.toBeInTheDocument()
  })

  it('shows it below the settle card when a backup is due', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    renderWithProviders(<HomeScreen />)

    const reminder = await screen.findByRole('region', { name: 'Backup reminder' })
    const settle = screen.getByRole('link', { name: 'Need to settle?' })

    expect(settle.compareDocumentPosition(reminder) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('gives focus to the page heading when "Not now" is chosen, since the button goes away', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    renderWithProviders(<HomeScreen />)

    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }))

    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toHaveFocus()
  })
})

describe('HomeScreen: the summary panel', () => {
  beforeEach(async () => {
    await db.moodEntries.clear()
    await db.thoughtRecords.clear()
  })

  it('shows the panel with its toggle, starting on 7 days', async () => {
    renderWithProviders(<HomeScreen />)

    expect(await screen.findByRole('region', { name: 'Summary' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '7 days' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '30 days' })).not.toBeChecked()
  })

  it('puts the panel below the backup reminder, last on the page', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    renderWithProviders(<HomeScreen />)

    const reminder = await screen.findByRole('region', { name: 'Backup reminder' })
    const summary = await screen.findByRole('region', { name: 'Summary' })

    expect(
      reminder.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('leaves the settle card first, and the quick actions above the panel', async () => {
    renderWithProviders(<HomeScreen />)

    const settle = screen.getByRole('link', { name: 'Need to settle?' })
    const thought = screen.getByRole('link', { name: 'Write down a thought' })
    const summary = await screen.findByRole('region', { name: 'Summary' })

    expect(settle.compareDocumentPosition(thought) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(thought.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('shows the belief-change blocks inside the panel, below the most frequent emotions', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    renderWithProviders(<HomeScreen />)

    const emotions = await screen.findByRole('heading', { name: 'Named most often' })
    const challenged = screen.getByRole('region', { name: 'Challenged thoughts' })
    const tested = screen.getByRole('region', { name: 'Tested thoughts' })

    expect(screen.getByRole('region', { name: 'Summary' })).toContainElement(challenged)
    expect(
      emotions.compareDocumentPosition(challenged) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(
      challenged.compareDocumentPosition(tested) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Summary' })).toContainElement(tested)
  })

  it('counts what is stored, in plain numbers', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    await addMoodEntry(oneEmotion('sad', 6))
    renderWithProviders(<HomeScreen />)

    expect(
      await screen.findByText('Last 7 days: 2 mood entries, no thought records'),
    ).toBeInTheDocument()
  })
})

describe('HomeScreen: the quick actions', () => {
  beforeEach(async () => {
    await db.moodEntries.clear()
  })

  it('offers "Log how I feel" and "Write down a thought", with their sections as targets', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByRole('link', { name: 'Log how I feel' })).toHaveAttribute('href', '/mood')
    expect(screen.getByRole('link', { name: 'Write down a thought' })).toHaveAttribute(
      'href',
      '/thoughts',
    )
  })

  it('puts them below the settle card, so the settle card stays first', () => {
    renderWithProviders(<HomeScreen />)

    const settle = screen.getByRole('link', { name: 'Need to settle?' })
    const feel = screen.getByRole('link', { name: 'Log how I feel' })
    const thought = screen.getByRole('link', { name: 'Write down a thought' })

    expect(settle.compareDocumentPosition(feel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(feel.compareDocumentPosition(thought) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('puts them above the backup reminder', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    renderWithProviders(<HomeScreen />)

    const reminder = await screen.findByRole('region', { name: 'Backup reminder' })
    const thought = screen.getByRole('link', { name: 'Write down a thought' })

    expect(
      thought.compareDocumentPosition(reminder) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('keeps the icons away from assistive technology', () => {
    renderWithProviders(<HomeScreen />)

    for (const name of ['Log how I feel', 'Write down a thought']) {
      const icon = screen.getByRole('link', { name }).querySelector('svg')

      expect(icon).toHaveAttribute('aria-hidden', 'true')
    }
  })
})

describe('HomeScreen: the logo beside the title', () => {
  it('shows the app logo to the left of the title, as a decorative image', () => {
    const { container } = renderWithProviders(<HomeScreen />)

    const logo = container.querySelector('img')
    const title = screen.getByRole('heading', { level: 1, name: 'cebete' })

    expect(logo).not.toBeNull()
    expect(logo).toHaveAttribute('src', '/icon.svg')
    expect(logo).toHaveAttribute('alt', '')
    expect(logo?.compareDocumentPosition(title)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(logo?.parentElement).toBe(title.parentElement)
  })

  it('keeps the logo out of the title, so the heading is still just "cebete"', () => {
    renderWithProviders(<HomeScreen />)

    const title = screen.getByRole('heading', { level: 1, name: 'cebete' })

    expect(title.querySelector('img')).toBeNull()
    expect(title).toHaveTextContent(/^cebete$/)
  })

  it('does not announce the logo as an image', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('points at a logo file that really is shipped with the app', () => {
    const { container } = renderWithProviders(<HomeScreen />)
    const src = container.querySelector('img')?.getAttribute('src') ?? ''

    expect(src).not.toBe('')
    expect(existsSync(join(process.cwd(), 'public', src))).toBe(true)
  })
})

describe('HomeScreen', () => {
  it('shows the app name and a friendly welcome message', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'cebete' })).toBeInTheDocument()
    expect(screen.getByText(/welcome back/i)).toBeInTheDocument()
  })

  it('shows a calm "Need to settle?" card that links to the quick settle screen', () => {
    renderWithProviders(<HomeScreen />)

    const card = screen.getByRole('link', { name: 'Need to settle?' })

    expect(card).toHaveAttribute('href', '/settle')
    expect(card).toHaveAccessibleDescription(/a few taps away/i)
  })

  it('does not link to the coping library: it is reached from the settle screen', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.queryByRole('link', { name: /coping library/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Back to home' })).not.toBeInTheDocument()
  })

  it('tells the user their data stays on their device', () => {
    renderWithProviders(<HomeScreen />)

    expect(screen.getByText(/kept on your device/i)).toBeInTheDocument()
  })
})
