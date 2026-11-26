import { act, fireEvent, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import HomeSummary from '@/insights/HomeSummary'
import { addThoughtRecord, saveThoughtChallenge, saveThoughtTest } from '@/thoughts/repository'
import { renderWithProviders } from '@tests/helpers/render'
import { currentChallenge, currentDoneTest, newThought } from '@tests/helpers/thoughts'

const DAY = 24 * 60 * 60 * 1000

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Saves with the clock set to a past moment, so a date can be told from today. */
async function savedAt<T>(daysAgo: number, save: () => Promise<T>): Promise<T> {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(Date.now() - daysAgo * DAY)

  try {
    return await save()
  } finally {
    clock.mockRestore()
  }
}

async function thought(belief: number, text = 'I will fail', daysAgo = 0): Promise<number> {
  return (
    await addThoughtRecord({
      ...newThought({ thought: text, belief }),
      createdAt: Date.now() - daysAgo * DAY - 1000,
    })
  ).id
}

async function challenge(id: number, belief: number, daysAgo = 0): Promise<void> {
  await savedAt(daysAgo, () =>
    saveThoughtChallenge(id, {
      balanced: 'A more balanced thought',
      belief,
      emotions: [{ emotion: 'anxious', intensity: 3 }],
    }),
  )
}

async function test(id: number, belief: number, daysAgo = 0): Promise<void> {
  await savedAt(daysAgo, () =>
    saveThoughtTest(id, {
      status: 'done',
      plan: 'Say hello',
      prediction: 'Nobody answers',
      result: 'They answered',
      belief,
    }),
  )
}

function challenged(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenged thoughts' })
}

function tested(): HTMLElement {
  return screen.getByRole('region', { name: 'Tested thoughts' })
}

async function open(): Promise<void> {
  renderWithProviders(<HomeSummary />)
  await screen.findByRole('region', { name: 'Summary' })
}

describe('the belief-change blocks: when there is nothing', () => {
  it('shows both blocks, each saying calmly that there is nothing in the range', async () => {
    await open()

    expect(challenged()).toHaveTextContent('None in the last 7 days.')
    expect(tested()).toHaveTextContent('None in the last 7 days.')
    expect(within(challenged()).queryByRole('list')).not.toBeInTheDocument()
  })

  it('does not count a thought that was never challenged or tested', async () => {
    await thought(8)

    await open()

    expect(challenged()).toHaveTextContent('None in the last 7 days.')
    expect(tested()).toHaveTextContent('None in the last 7 days.')
  })

  it('does not count a test that is only planned', async () => {
    const id = await thought(8)
    await saveThoughtTest(id, { status: 'planned', plan: 'Say hello', prediction: 'No answer' })

    await open()

    expect(tested()).toHaveTextContent('None in the last 7 days.')
  })
})

describe('the belief-change blocks: one or two thoughts, listed', () => {
  it('lists a single challenged thought with its belief before and after', async () => {
    await challenge(await thought(8, 'I will fail the exam'), 4)

    await open()

    expect(challenged()).toHaveTextContent('1 thought in the last 7 days')
    expect(within(challenged()).getByText('I will fail the exam')).toBeInTheDocument()
    expect(within(challenged()).getByText('from 8 to 4')).toBeInTheDocument()
    expect(challenged()).not.toHaveTextContent('Average')
  })

  it('lists two thoughts, newest first, and still gives no average', async () => {
    await challenge(await thought(9, 'The first one', 3), 5, 3)
    await challenge(await thought(8, 'The second one'), 2)

    await open()

    const rows = within(challenged()).getAllByRole('listitem')

    expect(challenged()).toHaveTextContent('2 thoughts in the last 7 days')
    expect(rows[0]).toHaveTextContent('The second one')
    expect(rows[0]).toHaveTextContent('from 8 to 2')
    expect(rows[1]).toHaveTextContent('The first one')
    expect(rows[1]).toHaveTextContent('from 9 to 5')
    expect(challenged()).not.toHaveTextContent('Average')
  })

  it('lists a tested thought the same way, from the belief after the test', async () => {
    await test(await thought(9, 'Nobody will talk to me'), 3)

    await open()

    expect(tested()).toHaveTextContent('1 thought in the last 7 days')
    expect(within(tested()).getByText('Nobody will talk to me')).toBeInTheDocument()
    expect(within(tested()).getByText('from 9 to 3')).toBeInTheDocument()
  })

  it('keeps the full text of a long thought on the page, only trimmed on screen', async () => {
    const long = `${'I will never manage this '.repeat(12)}at all`
    await challenge(await thought(8, long), 4)

    await open()

    expect(within(challenged()).getByText(long)).toBeInTheDocument()
  })
})

describe('the belief-change blocks: three or more, averaged', () => {
  it('shows the average belief from before to after, and no list', async () => {
    await challenge(await thought(8, 'One'), 4)
    await challenge(await thought(7, 'Two'), 3)
    await challenge(await thought(8, 'Three'), 4)

    await open()

    expect(challenged()).toHaveTextContent('3 thoughts in the last 7 days')
    expect(within(challenged()).getByText('Average belief: from 7.7 to 3.7')).toBeInTheDocument()
    expect(within(challenged()).queryByRole('list')).not.toBeInTheDocument()
  })

  it('shows a whole-number average without a decimal', async () => {
    for (const text of ['One', 'Two', 'Three']) {
      await test(await thought(8, text), 4)
    }

    await open()

    expect(within(tested()).getByText('Average belief: from 8 to 4')).toBeInTheDocument()
  })

  it('keeps the two methods apart, and lets a thought that was both appear in both', async () => {
    const both = await thought(8, 'Both')
    await challenge(both, 4)
    await test(both, 2)
    await challenge(await thought(8, 'Only challenged'), 5)

    await open()

    expect(challenged()).toHaveTextContent('2 thoughts in the last 7 days')
    expect(tested()).toHaveTextContent('1 thought in the last 7 days')
    expect(within(tested()).getByText('from 8 to 2')).toBeInTheDocument()
  })
})

describe('the belief-change blocks: wording', () => {
  it('shows a belief that went up as plainly as one that dropped', async () => {
    await challenge(await thought(4, 'It went up'), 7)
    await challenge(await thought(8, 'It went down'), 3)

    await open()

    const rows = within(challenged()).getAllByRole('listitem')
    const texts = rows.map((row) => row.textContent)

    expect(texts.some((text) => text.includes('from 4 to 7'))).toBe(true)
    expect(texts.some((text) => text.includes('from 8 to 3'))).toBe(true)
    expect(challenged().textContent).not.toMatch(
      /better|worse|improv|progress|great|drop|rose|fell/i,
    )
  })

  it('shows a belief that did not change in the same plain way', async () => {
    await challenge(await thought(5, 'Steady'), 5)

    await open()

    expect(within(challenged()).getByText('from 5 to 5')).toBeInTheDocument()
  })

  it('makes each block a labelled section with its own heading, so it can be read in order', async () => {
    await open()

    expect(
      within(challenged()).getByRole('heading', { level: 3, name: 'Challenged thoughts' }),
    ).toBeInTheDocument()
    expect(
      within(tested()).getByRole('heading', { level: 3, name: 'Tested thoughts' }),
    ).toBeInTheDocument()
  })
})

describe('the belief-change blocks: the range', () => {
  it('follows the toggle: 30 days takes in what 7 days does not', async () => {
    await challenge(await thought(8, 'Recent'), 4)
    await challenge(await thought(9, 'Older'), 3, 20)
    await test(await thought(7, 'Older test'), 2, 15)

    await open()

    expect(challenged()).toHaveTextContent('1 thought in the last 7 days')
    expect(tested()).toHaveTextContent('None in the last 7 days.')

    fireEvent.click(screen.getByRole('radio', { name: '30 days' }))

    expect(challenged()).toHaveTextContent('2 thoughts in the last 30 days')
    expect(tested()).toHaveTextContent('1 thought in the last 30 days')

    fireEvent.click(screen.getByRole('radio', { name: '7 days' }))

    expect(challenged()).toHaveTextContent('1 thought in the last 7 days')
  })

  it('counts an old thought that was challenged inside the range, by the day it was challenged', async () => {
    const id = await thought(8, 'An old worry', 40)
    await challenge(id, 3)

    await open()

    expect(challenged()).toHaveTextContent('1 thought in the last 7 days')
    expect(screen.getByText(/not enough yet/i)).toBeInTheDocument()
  })

  it('leaves out a recent thought whose challenge is older than the range', async () => {
    const id = await thought(8, 'A recent thought')
    await challenge(id, 3, 20)

    await open()

    expect(challenged()).toHaveTextContent('None in the last 7 days.')
  })

  it('places a challenge saved before dates existed by the time of the thought', async () => {
    const recent = await thought(8, 'Recent and undated', 2)
    const old = await thought(8, 'Old and undated', 20)
    await db.table('thoughtRecords').update(recent, { challenge: currentChallenge() })
    await db.table('thoughtRecords').update(old, { challenge: currentChallenge() })

    await open()

    expect(challenged()).toHaveTextContent('1 thought in the last 7 days')
    expect(within(challenged()).getByText('Recent and undated')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: '30 days' }))

    expect(challenged()).toHaveTextContent('2 thoughts in the last 30 days')
  })

  it('places a result logged before dates existed by the time of the thought', async () => {
    const recent = await thought(8, 'Recent and undated', 2)
    const old = await thought(8, 'Old and undated', 20)
    await db.table('thoughtRecords').update(recent, { test: currentDoneTest() })
    await db.table('thoughtRecords').update(old, { test: currentDoneTest() })

    await open()

    expect(tested()).toHaveTextContent('1 thought in the last 7 days')

    fireEvent.click(screen.getByRole('radio', { name: '30 days' }))

    expect(tested()).toHaveTextContent('2 thoughts in the last 30 days')
  })
})

describe('the belief-change blocks: following the data', () => {
  it('updates by itself when a challenge is saved', async () => {
    const id = await thought(8, 'A thought')
    await open()
    expect(challenged()).toHaveTextContent('None in the last 7 days.')

    await act(async () => {
      await challenge(id, 4)
    })

    expect(await within(challenged()).findByText('from 8 to 4')).toBeInTheDocument()
  })

  it('updates by itself when a result is logged, and when a thought is deleted', async () => {
    const id = await thought(8, 'A thought')
    await open()

    await act(async () => {
      await test(id, 2)
    })

    expect(await within(tested()).findByText('from 8 to 2')).toBeInTheDocument()

    await act(async () => {
      await db.thoughtRecords.delete(id)
    })

    expect(await within(tested()).findByText('None in the last 7 days.')).toBeInTheDocument()
  })

  it('leaves out a damaged record', async () => {
    await challenge(await thought(8, 'A good one'), 4)
    await db.table('thoughtRecords').add({
      createdAt: Date.now(),
      thought: 'A damaged one',
      challenge: { balanced: '' },
    })

    await open()

    expect(challenged()).toHaveTextContent('1 thought in the last 7 days')
    expect(challenged()).not.toHaveTextContent('A damaged one')
  })
})
