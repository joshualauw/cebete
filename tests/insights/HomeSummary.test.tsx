import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import HomeSummary from '@/insights/HomeSummary'
import { db } from '@/db/db'
import type { Emotion } from '@/mood/emotions'
import { addMoodEntry } from '@/mood/repository'
import { addThoughtRecord } from '@/thoughts/repository'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const DAY = 24 * 60 * 60 * 1000

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
})

async function mood(names: readonly Emotion[], daysAgo = 0): Promise<void> {
  await addMoodEntry({
    emotions: names.map((emotion) => ({ emotion, intensity: 5 })),
    createdAt: Date.now() - daysAgo * DAY - 1000,
  })
}

async function thought(names: readonly Emotion[], daysAgo = 0): Promise<void> {
  await addThoughtRecord({
    ...newThought({ emotions: names.map((emotion) => ({ emotion, intensity: 5 })) }),
    createdAt: Date.now() - daysAgo * DAY - 1000,
  })
}

function panel(): HTMLElement {
  return screen.getByRole('region', { name: 'Summary' })
}

function barRows(): HTMLElement[] {
  return within(screen.getByRole('list', { name: 'Most frequent emotions' })).getAllByRole(
    'listitem',
  )
}

describe('the summary panel: the range', () => {
  it('is a labelled panel with a 7 / 30 day toggle, starting on 7 days', async () => {
    await mood(['calm'])

    renderWithProviders(<HomeSummary />)

    await screen.findByRole('region', { name: 'Summary' })

    expect(
      within(panel())
        .getAllByRole('radio')
        .map((radio) => radio.getAttribute('value')),
    ).toEqual(['7', '30'])
    expect(screen.getByRole('radio', { name: '7 days' })).toBeChecked()
    expect(screen.getByRole('radio', { name: '30 days' })).not.toBeChecked()
    expect(screen.getByRole('group', { name: 'Time range' })).toBeInTheDocument()
  })

  it('shows 7 days again at every visit, since the choice is not remembered', async () => {
    await mood(['calm'])
    const first = renderWithProviders(<HomeSummary />)

    fireEvent.click(await screen.findByRole('radio', { name: '30 days' }))
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked()
    first.unmount()

    renderWithProviders(<HomeSummary />)

    expect(await screen.findByRole('radio', { name: '7 days' })).toBeChecked()
  })
})

describe('the summary panel: the header and the bars', () => {
  it('says how many mood entries and thought records there are in the range', async () => {
    await mood(['calm'])
    await mood(['sad'])
    await thought(['anxious'])

    renderWithProviders(<HomeSummary />)

    expect(
      await screen.findByText('Last 7 days: 2 mood entries, 1 thought record'),
    ).toBeInTheDocument()
  })

  it('shows the most frequent emotions as rows with their counts, most frequent first', async () => {
    await mood(['anxious', 'calm'])
    await mood(['anxious'])
    await thought(['anxious', 'sad'])
    await thought(['sad'])

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('list', { name: 'Most frequent emotions' })

    const rows = barRows()

    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('Anxious')
    expect(rows[0]).toHaveTextContent('3')
    expect(rows[1]).toHaveTextContent('Sad')
    expect(rows[1]).toHaveTextContent('2')
    expect(rows[2]).toHaveTextContent('Calm')
    expect(rows[2]).toHaveTextContent('1')
  })

  it('counts a record with three feelings once for each of them', async () => {
    await thought(['anxious', 'sad', 'tired'])

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('list', { name: 'Most frequent emotions' })

    expect(barRows()).toHaveLength(3)
  })

  it('lists at most five emotions', async () => {
    await mood(['calm', 'happy', 'grateful'])
    await mood(['hopeful', 'content', 'tired'])

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('list', { name: 'Most frequent emotions' })

    expect(barRows()).toHaveLength(5)
  })

  it('puts the same emotion in the same place every time, whatever order things were added', async () => {
    await mood(['sad', 'calm'])

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('list', { name: 'Most frequent emotions' })

    expect(barRows()[0]).toHaveTextContent('Calm')
    expect(barRows()[1]).toHaveTextContent('Sad')
  })
})

describe('the summary panel: the bars can be read as text', () => {
  it('says each emotion and its count in words, and hides the bar itself', async () => {
    await mood(['anxious'])
    await mood(['anxious'])
    await mood(['calm'])

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('list', { name: 'Most frequent emotions' })

    expect(barRows()[0]).toHaveTextContent('Anxious')
    expect(barRows()[0]).toHaveTextContent('Named 2 times')
    expect(barRows()[1]).toHaveTextContent('Named 1 time')
    for (const row of barRows()) {
      expect(row.querySelector('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('sizes the bars against the most frequent emotion', async () => {
    await mood(['anxious'])
    await mood(['anxious'])
    await mood(['calm'])

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('list', { name: 'Most frequent emotions' })

    const widths = barRows().map(
      (row) => row.querySelector('[aria-hidden="true"] > div')?.getAttribute('class') ?? '',
    )

    expect(widths).toHaveLength(2)
    expect(widths[0]).not.toBe(widths[1])
  })
})

describe('the summary panel: switching the range', () => {
  it('updates the header and the bars when the user switches to 30 days', async () => {
    await mood(['calm'])
    await mood(['sad'], 20)
    await thought(['sad'], 15)

    renderWithProviders(<HomeSummary />)

    expect(
      await screen.findByText('Last 7 days: 1 mood entry, no thought records'),
    ).toBeInTheDocument()
    expect(barRows()).toHaveLength(1)

    fireEvent.click(screen.getByRole('radio', { name: '30 days' }))

    expect(screen.getByText('Last 30 days: 2 mood entries, 1 thought record')).toBeInTheDocument()
    expect(barRows()).toHaveLength(2)
    expect(barRows()[0]).toHaveTextContent('Sad')
    expect(barRows()[0]).toHaveTextContent('2')
  })

  it('goes back to 7 days when the user switches back', async () => {
    await mood(['calm'])
    await mood(['sad'], 20)
    renderWithProviders(<HomeSummary />)

    fireEvent.click(await screen.findByRole('radio', { name: '30 days' }))
    fireEvent.click(screen.getByRole('radio', { name: '7 days' }))

    expect(screen.getByText('Last 7 days: 1 mood entry, no thought records')).toBeInTheDocument()
  })

  it('leaves out what is older than the range', async () => {
    await mood(['calm'], 40)

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('region', { name: 'Summary' })
    fireEvent.click(screen.getByRole('radio', { name: '30 days' }))

    expect(
      screen.getByText('Last 30 days: no mood entries, no thought records'),
    ).toBeInTheDocument()
  })

  it('announces a change of range politely', async () => {
    await mood(['calm'])
    renderWithProviders(<HomeSummary />)

    const header = (await screen.findByText(/^Last 7 days/)).closest('[aria-live]')

    expect(header).toHaveAttribute('aria-live', 'polite')
  })
})

describe('the summary panel: when there is nothing to show', () => {
  it('says kindly that there is not enough yet, instead of an empty chart', async () => {
    renderWithProviders(<HomeSummary />)

    expect(await screen.findByText(/not enough yet/i)).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Most frequent emotions' })).not.toBeInTheDocument()
    expect(screen.getByText('Last 7 days: no mood entries, no thought records')).toBeInTheDocument()
  })

  it('says the same when everything is older than the range', async () => {
    await mood(['calm'], 12)

    renderWithProviders(<HomeSummary />)

    expect(await screen.findByText(/not enough yet/i)).toBeInTheDocument()
  })

  it('shows nothing at all while the data is still being read, so it never flashes', () => {
    const { container } = renderWithProviders(<HomeSummary />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe('the summary panel: following the data', () => {
  it('updates by itself when an entry or a record is added', async () => {
    renderWithProviders(<HomeSummary />)
    await screen.findByText(/not enough yet/i)

    await mood(['calm'])

    expect(
      await screen.findByText('Last 7 days: 1 mood entry, no thought records'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/not enough yet/i)).not.toBeInTheDocument()

    await thought(['anxious'])

    expect(
      await screen.findByText('Last 7 days: 1 mood entry, 1 thought record'),
    ).toBeInTheDocument()
  })

  it('updates by itself when entries are removed', async () => {
    await mood(['calm'])
    renderWithProviders(<HomeSummary />)
    await screen.findByText('Last 7 days: 1 mood entry, no thought records')

    await db.moodEntries.clear()

    expect(await screen.findByText(/not enough yet/i)).toBeInTheDocument()
  })

  it('leaves out a row that cannot be read as an entry', async () => {
    await mood(['calm'])
    await db.table('moodEntries').add({ createdAt: Date.now(), intensity: 3 })
    await db.table('thoughtRecords').add({ createdAt: Date.now(), thought: '' })

    renderWithProviders(<HomeSummary />)

    expect(
      await screen.findByText('Last 7 days: 1 mood entry, no thought records'),
    ).toBeInTheDocument()
  })
})

describe('the summary panel: wording', () => {
  it('reports counts only, with no judgement and no streaks', async () => {
    await mood(['sad'])
    await mood(['sad'])
    await mood(['sad'])
    await mood(['calm'], 1)

    renderWithProviders(<HomeSummary />)
    await screen.findByRole('list', { name: 'Most frequent emotions' })

    expect(panel().textContent).not.toMatch(
      /streak|improv|better|worse|progress|great|well done|keep it up|decline|trend/i,
    )
  })
})
