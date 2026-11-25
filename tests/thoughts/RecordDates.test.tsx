import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { restoreBackup } from '@/backup/restore'
import { parseBackup } from '@/backup/parse'
import { db } from '@/db/db'
import { formatEntryDate } from '@/mood/format'
import { addThoughtRecord, saveThoughtChallenge, saveThoughtTest } from '@/thoughts/repository'
import type { ThoughtChallenge, ThoughtTest } from '@/thoughts/types'
import { backupText, currentTables } from '@tests/helpers/backup'
import { openRecordScreen } from '@tests/helpers/recordScreen'
import {
  currentChallenge,
  currentDoneTest,
  currentThought,
  newThought,
} from '@tests/helpers/thoughts'

const OLD = new Date(2026, 5, 10, 12, 0).getTime()
const OLDER = new Date(2026, 4, 2, 12, 0).getTime()

const BALANCED_LABEL = 'What would be a more balanced thought?'
const RESULT_LABEL = 'What happened when you tested it?'
const BELIEF_LABEL = 'How strongly do you believe the original thought now?'
const PLAN_LABEL = 'How and when could you test this thought?'

const challenge: ThoughtChallenge = {
  balanced: 'I can cope',
  belief: 4,
  emotions: [{ emotion: 'anxious', intensity: 3 }],
}

const planned: ThoughtTest = {
  status: 'planned',
  plan: 'Say hello to two people',
  prediction: 'Nobody will answer',
}

const done: ThoughtTest = { ...planned, status: 'done', result: 'Both answered', belief: 3 }

let id = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (await addThoughtRecord({ ...newThought(), createdAt: OLDER })).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Saves with the clock set to a past moment, so a date can be told from today. */
async function savedAt<T>(moment: number, save: () => Promise<T>): Promise<T> {
  const clock = vi.spyOn(Date, 'now').mockReturnValue(moment)

  try {
    return await save()
  } finally {
    clock.mockRestore()
  }
}

function challengePart(): HTMLElement {
  return screen.getByRole('region', { name: 'Challenge' })
}

function testPart(): HTMLElement {
  return screen.getByRole('region', { name: 'Test' })
}

function type(label: string, text: string): void {
  fireEvent.change(screen.getByLabelText(label), { target: { value: text } })
}

function step(number: number): void {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) }))
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

async function flowClosed(name: string): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name })).not.toBeInTheDocument()
  })
}

const today = (): string => formatEntryDate(Date.now())

describe('the Challenge part: when it was challenged', () => {
  it('shows the date the challenge was saved', async () => {
    await savedAt(OLD, () => saveThoughtChallenge(id, challenge))

    await openRecordScreen(id)

    expect(challengePart()).toHaveTextContent(`Challenged on ${formatEntryDate(OLD)}`)
  })

  it('shows today’s date right after a challenge is saved', async () => {
    await openRecordScreen(id)
    fireEvent.click(within(challengePart()).getByRole('button', { name: 'Challenge this thought' }))
    step(3)
    type(BALANCED_LABEL, 'I can cope')
    step(5)
    save()
    await flowClosed('Challenge this thought')

    expect(challengePart()).toHaveTextContent(`Challenged on ${today()}`)
  })

  it('moves to today’s date when the challenge is revised and saved', async () => {
    await savedAt(OLD, () => saveThoughtChallenge(id, challenge))
    await openRecordScreen(id)
    expect(challengePart()).toHaveTextContent(formatEntryDate(OLD))

    fireEvent.click(within(challengePart()).getByRole('button', { name: 'Revise challenge' }))
    step(3)
    type(BALANCED_LABEL, 'A better balanced thought')
    step(5)
    save()
    await flowClosed('Challenge this thought')

    expect(challengePart()).toHaveTextContent(`Challenged on ${today()}`)
    expect(challengePart()).not.toHaveTextContent(formatEntryDate(OLD))
  })

  it('shows no date for a thought that has not been challenged', async () => {
    await openRecordScreen(id)

    expect(challengePart()).not.toHaveTextContent('Challenged on')
  })

  it('shows no date, and works as before, for a challenge saved before dates existed', async () => {
    await db.table('thoughtRecords').put({
      ...currentThought(50),
      challenge: currentChallenge(),
    })

    await openRecordScreen(50)

    expect(challengePart()).toHaveTextContent('I may stumble, but I can recover')
    expect(challengePart()).not.toHaveTextContent('Challenged on')
    expect(within(challengePart()).getByRole('button', { name: 'Revise challenge' })).toBeEnabled()
  })
})

describe('the Test part: when it was tested', () => {
  it('shows no date while the test is only planned', async () => {
    await saveThoughtTest(id, planned)

    await openRecordScreen(id)

    expect(testPart()).toHaveTextContent('Test planned')
    expect(testPart()).not.toHaveTextContent('Tested on')
  })

  it('shows today’s date once the result is logged', async () => {
    await saveThoughtTest(id, planned)
    await openRecordScreen(id)

    fireEvent.click(within(testPart()).getByRole('button', { name: 'Log the result' }))
    type(RESULT_LABEL, 'Both of them answered')
    step(2)
    fireEvent.change(screen.getByLabelText(BELIEF_LABEL), { target: { value: '3' } })
    save()
    await flowClosed('Log the result')

    expect(testPart()).toHaveTextContent(`Tested on ${today()}`)
  })

  it('shows the date the result was logged', async () => {
    await savedAt(OLD, () => saveThoughtTest(id, done))

    await openRecordScreen(id)

    expect(testPart()).toHaveTextContent(`Tested on ${formatEntryDate(OLD)}`)
  })

  it('moves to today’s date when the result is revised and saved', async () => {
    await savedAt(OLD, () => saveThoughtTest(id, done))
    await openRecordScreen(id)

    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the result' }))
    type(RESULT_LABEL, 'Only one of them answered')
    step(2)
    save()
    await flowClosed('Log the result')

    expect(testPart()).toHaveTextContent(`Tested on ${today()}`)
    expect(testPart()).not.toHaveTextContent(formatEntryDate(OLD))
  })

  it('keeps the date when only the plan is revised', async () => {
    await savedAt(OLD, () => saveThoughtTest(id, done))
    await openRecordScreen(id)

    fireEvent.click(within(testPart()).getByRole('button', { name: 'Revise the plan' }))
    type(PLAN_LABEL, 'Say hello to three people')
    step(2)
    save()
    await flowClosed('Plan a test')

    expect(testPart()).toHaveTextContent('Say hello to three people')
    expect(testPart()).toHaveTextContent(`Tested on ${formatEntryDate(OLD)}`)
  })

  it('shows no date, and works as before, for a result logged before dates existed', async () => {
    await db.table('thoughtRecords').put({ ...currentThought(51), test: currentDoneTest() })

    await openRecordScreen(51)

    expect(testPart()).toHaveTextContent('Both of them answered')
    expect(testPart()).not.toHaveTextContent('Tested on')
    expect(within(testPart()).getByRole('button', { name: 'Revise the result' })).toBeEnabled()
  })

  it('shows no test date on a thought that has no test', async () => {
    await openRecordScreen(id)

    expect(testPart()).not.toHaveTextContent('Tested on')
  })
})

describe('the dates after a backup is restored', () => {
  it('are shown on the record screen exactly as they were', async () => {
    const text = backupText({
      tables: currentTables(
        [],
        [
          currentThought(60, {
            challenge: currentChallenge({ challengedAt: OLD }),
            test: currentDoneTest({ testedAt: OLDER }),
          }),
        ],
      ),
    })

    await restoreBackup(parseBackup(text))
    await openRecordScreen(60)

    expect(challengePart()).toHaveTextContent(`Challenged on ${formatEntryDate(OLD)}`)
    expect(testPart()).toHaveTextContent(`Tested on ${formatEntryDate(OLDER)}`)
  })
})
