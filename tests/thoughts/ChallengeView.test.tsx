import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { addThoughtRecord, saveThoughtChallenge } from '@/thoughts/repository'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const OLDER = new Date(2020, 0, 1, 9, 0).getTime()
const NEWER = new Date(2020, 0, 2, 9, 0).getTime()

const BELIEF_LABEL = 'How strongly do you believe the original thought now?'

let firstId = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  firstId = (
    await addThoughtRecord({
      ...newThought({
        situation: 'Team meeting',
        thought: 'I will fail',
        belief: 9,
        emotions: [
          { emotion: 'anxious', intensity: 8 },
          { emotion: 'sad', intensity: 5 },
        ],
      }),
      createdAt: OLDER,
    })
  ).id
  await addThoughtRecord({ ...newThought({ thought: 'second thought' }), createdAt: NEWER })
  await saveThoughtChallenge(firstId, {
    evidenceFor: 'I stumbled once',
    evidenceAgainst: 'I prepared well',
    balanced: 'I can cope',
    belief: 4,
    emotions: [
      { emotion: 'anxious', intensity: 3 },
      { emotion: 'sad', intensity: 2 },
    ],
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

function viewButton(): Promise<HTMLElement> {
  return screen.findByRole('button', { name: /^View challenge: “I will fail/ })
}

function viewRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Your challenge' })
}

function flowRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge this thought' })
}

function row(label: string): HTMLElement {
  const element = within(viewRegion()).getByText(label).parentElement

  if (element === null) {
    throw new Error(`The row for ${label} has no parent`)
  }

  return element
}

function advance(): void {
  fireEvent.click(screen.getByRole('button', { name: /^(Next|Skip)$/ }))
}

function type(label: string, text: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } })
}

async function openView(): Promise<void> {
  renderWithProviders(<ThoughtsScreen />)
  fireEvent.click(await viewButton())
}

async function flowGone(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Challenge this thought' })).not.toBeInTheDocument()
  })
}

describe('the View challenge button', () => {
  it('shows on a challenged card, and a card with no challenge keeps Challenge this thought', async () => {
    renderWithProviders(<ThoughtsScreen />)

    expect(await viewButton()).toHaveTextContent('View challenge')
    expect(screen.getAllByRole('button', { name: /^View challenge/ })).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: /^Challenge this thought: “second thought/ }),
    ).toBeInTheDocument()
  })
})

describe('viewing a challenge', () => {
  it('opens in place, on its heading, showing every part and the before and after', async () => {
    await openView()

    const view = within(viewRegion())

    expect(view.getByRole('heading', { level: 2, name: 'Your challenge' })).toHaveFocus()
    expect(view.getByText('Team meeting')).toBeInTheDocument()
    expect(view.getByText('I will fail')).toBeInTheDocument()
    expect(view.getByText('I stumbled once')).toBeInTheDocument()
    expect(view.getByText('I prepared well')).toBeInTheDocument()
    expect(view.getByText('I can cope')).toBeInTheDocument()
    expect(row('Belief in the thought')).toHaveTextContent('9 → 4')
    expect(row('Anxious')).toHaveTextContent('8 → 3')
    expect(row('Sad')).toHaveTextContent('5 → 2')
  })

  it('gives the before and after a spoken form', async () => {
    await openView()

    expect(within(viewRegion()).getByText('From 9 to 4 out of 10')).toBeInTheDocument()
    expect(within(viewRegion()).getByText('From 8 to 3 out of 10')).toBeInTheDocument()
  })

  it('shows nothing editable until the user chooses to revise', async () => {
    await openView()

    expect(within(viewRegion()).queryByRole('textbox')).not.toBeInTheDocument()
    expect(within(viewRegion()).queryByRole('slider')).not.toBeInTheDocument()
    expect(within(viewRegion()).queryByRole('checkbox')).not.toBeInTheDocument()
    expect(within(viewRegion()).getByRole('button', { name: 'Close' })).toBeEnabled()
    expect(within(viewRegion()).getByRole('button', { name: 'Revise challenge' })).toBeEnabled()
  })

  it('leaves out the evidence that was not given', async () => {
    await saveThoughtChallenge(firstId, {
      balanced: 'only this',
      belief: 4,
      emotions: [
        { emotion: 'anxious', intensity: 3 },
        { emotion: 'sad', intensity: 2 },
      ],
    })
    await openView()

    expect(within(viewRegion()).queryByText('What speaks for it')).not.toBeInTheDocument()
    expect(within(viewRegion()).queryByText('What speaks against it')).not.toBeInTheDocument()
    expect(within(viewRegion()).getByText('only this')).toBeInTheDocument()
  })

  it('changes nothing when closed, and returns focus to the card’s main button', async () => {
    const before = await db.thoughtRecords.get(firstId)

    await openView()
    fireEvent.click(within(viewRegion()).getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Your challenge' })).not.toBeInTheDocument()
    })
    expect(await db.thoughtRecords.get(firstId)).toEqual(before)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^View challenge: “I will fail/ })).toHaveFocus()
    })
  })

  it('switches every other action off while it is open, and back on after', async () => {
    await openView()

    expect(screen.getByRole('button', { name: 'New thought record' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Challenge this thought: “second/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /^Edit the thought record “second/ })).toBeDisabled()

    fireEvent.click(within(viewRegion()).getByRole('button', { name: 'Close' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'New thought record' })).toBeEnabled()
    })
    expect(screen.getByRole('button', { name: /^Challenge this thought: “second/ })).toBeEnabled()
  })
})

describe('revising a challenge', () => {
  async function openRevision(): Promise<void> {
    await openView()
    fireEvent.click(within(viewRegion()).getByRole('button', { name: 'Revise challenge' }))
  }

  it('opens the challenge flow filled with the saved challenge, with every step reachable', async () => {
    await openRevision()

    expect(within(flowRegion()).getByText('Challenge · Step 1 of 5')).toBeInTheDocument()
    expect(screen.getByLabelText('What speaks for this thought?')).toHaveValue('I stumbled once')
    for (const number of [1, 2, 3, 4, 5]) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) }),
      ).not.toHaveAttribute('aria-disabled')
    }

    fireEvent.click(screen.getByRole('button', { name: /^Step 2:/ }))

    expect(screen.getByLabelText('What speaks against this thought?')).toHaveValue(
      'I prepared well',
    )

    fireEvent.click(screen.getByRole('button', { name: /^Step 3:/ }))

    expect(screen.getByLabelText('What would be a more balanced thought?')).toHaveValue(
      'I can cope',
    )

    fireEvent.click(screen.getByRole('button', { name: /^Step 4:/ }))

    expect(screen.getByLabelText(BELIEF_LABEL)).toHaveValue('4')

    fireEvent.click(screen.getByRole('button', { name: /^Step 5:/ }))

    expect(screen.getByLabelText('Anxious intensity')).toHaveValue('3')
    expect(screen.getByLabelText('Sad intensity')).toHaveValue('2')
  })

  it('saves over the old challenge, and the card and the view show the change', async () => {
    await openRevision()
    fireEvent.click(screen.getByRole('button', { name: /^Step 3:/ }))
    type('What would be a more balanced thought?', 'a better balanced thought')
    fireEvent.click(screen.getByRole('button', { name: /^Step 4:/ }))
    fireEvent.change(screen.getByLabelText(BELIEF_LABEL), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /^Step 5:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await flowGone()

    const card = (await screen.findByText('a better balanced thought')).closest('li')

    expect(card).toHaveTextContent('9 → 1')
    expect(screen.queryByText('I can cope')).not.toBeInTheDocument()
    expect(screen.getByText('Challenge saved.')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^View challenge: “I will fail/ })).toHaveFocus()
    })

    fireEvent.click(screen.getByRole('button', { name: /^View challenge: “I will fail/ }))

    expect(row('Belief in the thought')).toHaveTextContent('9 → 1')
    expect(viewRegion()).toHaveTextContent('a better balanced thought')
    expect(await db.thoughtRecords.count()).toBe(2)
  })

  it('keeps the old challenge when the revision is cancelled', async () => {
    const before = await db.thoughtRecords.get(firstId)

    await openRevision()
    fireEvent.click(screen.getByRole('button', { name: /^Step 3:/ }))
    type('What would be a more balanced thought?', 'never saved')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(
      screen.getByRole('heading', { level: 2, name: 'Discard this challenge?' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await flowGone()

    expect(await db.thoughtRecords.get(firstId)).toEqual(before)
    expect(screen.getByText('I can cope')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^View challenge: “I will fail/ })).toHaveFocus()
    })
  })

  it('closes a revision with nothing changed without asking', async () => {
    await openRevision()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await flowGone()

    expect(screen.queryByText('Discard this challenge?')).not.toBeInTheDocument()
  })

  it('can go on to Save straight away, since every required answer is already there', async () => {
    await openRevision()
    advance()
    advance()
    advance()
    advance()
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await flowGone()

    expect((await db.thoughtRecords.get(firstId))?.challenge?.balanced).toBe('I can cope')
  })
})

describe('editing the feelings of a challenged record', () => {
  async function editFeelings(change: () => void): Promise<void> {
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(
      await screen.findByRole('button', { name: /^Edit the thought record “I will fail/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: /^Step 2:/ }))
    change()
    fireEvent.click(screen.getByRole('button', { name: /^Step 6:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => {
      expect(screen.queryByRole('region', { name: 'Edit thought record' })).not.toBeInTheDocument()
    })
  }

  it('keeps the challenge on the card when other parts are edited', async () => {
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(
      await screen.findByRole('button', { name: /^Edit the thought record “I will fail/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: /^Step 4:/ }))
    type('What went through your mind?', 'I might fail')
    fireEvent.click(screen.getByRole('button', { name: /^Step 6:/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('I might fail')).toBeInTheDocument()
    expect(screen.getByText('I can cope')).toBeInTheDocument()
  })

  it('keeps the challenge rating of a feeling that remains, and shows a new one at its own rating', async () => {
    await editFeelings(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Sad' }))
      fireEvent.click(screen.getByRole('checkbox', { name: 'Tired' }))
    })

    fireEvent.click(await screen.findByRole('button', { name: /^View challenge: “I will fail/ }))

    expect(row('Anxious')).toHaveTextContent('8 → 3')
    expect(row('Tired')).toHaveTextContent('5 → 5')
    expect(within(viewRegion()).queryByText('Sad')).not.toBeInTheDocument()
    expect((await db.thoughtRecords.get(firstId))?.challenge?.emotions).toEqual([
      { emotion: 'anxious', intensity: 3 },
      { emotion: 'tired', intensity: 5 },
    ])
  })

  it('never shows a rating for a feeling the record no longer has', async () => {
    await editFeelings(() => {
      fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
    })

    fireEvent.click(await screen.findByRole('button', { name: /^View challenge: “I will fail/ }))

    expect(row('Sad')).toHaveTextContent('5 → 2')
    expect(within(viewRegion()).queryByText('Anxious')).not.toBeInTheDocument()
  })
})

describe('deleting a challenged record', () => {
  it('removes the record with its challenge', async () => {
    renderWithProviders(<ThoughtsScreen />)
    fireEvent.click(
      await screen.findByRole('button', { name: /^Delete the thought record “I will fail/ }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(screen.queryByText('I will fail')).not.toBeInTheDocument()
    })
    expect(screen.queryByText('I can cope')).not.toBeInTheDocument()
    expect(await db.thoughtRecords.get(firstId)).toBeUndefined()
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('tells the user, and recreates nothing, when the record is deleted while its view is open', async () => {
    await openView()
    await db.thoughtRecords.delete(firstId)

    expect(await screen.findByText(/was deleted, so nothing was saved/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Your challenge' })).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(1)
  })
})
