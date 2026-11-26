import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import BackupReminder from '@/backup/BackupReminder'
import { readSnoozedUntil, recordBackup, snoozeBackupReminder } from '@/backup/lastBackup'
import { SNOOZE_MS } from '@/backup/reminder'
import { addCopingItem } from '@/coping/repository'
import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import { copingItem } from '@tests/helpers/coping'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

const DAY = 24 * 60 * 60 * 1000

beforeEach(async () => {
  await db.moodEntries.clear()
  await db.thoughtRecords.clear()
  await db.copingItems.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function withData(): Promise<void> {
  await addMoodEntry(oneEmotion('calm', 4))
}

/** Gives the data check time to finish, to prove nothing appears afterwards either. */
async function settle(): Promise<void> {
  await act(async () => {
    await db.moodEntries.count()
  })
}

const reminder = (): HTMLElement | null => screen.queryByRole('region', { name: 'Backup reminder' })

describe('BackupReminder: when it is shown', () => {
  it('invites a first backup when there is data and none was ever made', async () => {
    await withData()

    renderWithProviders(<BackupReminder />)

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toHaveTextContent(
      /have not made a backup yet/i,
    )
    expect(screen.getByRole('link', { name: 'Back up now' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Not now' })).toBeInTheDocument()
  })

  it('says it has been a while when the last backup is more than 14 days old', async () => {
    await withData()
    recordBackup(Date.now() - 20 * DAY)

    renderWithProviders(<BackupReminder />)

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toHaveTextContent(
      /a while since your last backup/i,
    )
  })

  it('counts a mood entry as data worth backing up', async () => {
    await addMoodEntry(oneEmotion('calm', 4))

    renderWithProviders(<BackupReminder />)

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toBeInTheDocument()
  })

  it('counts a thought record as data worth backing up', async () => {
    await db.thoughtRecords.add({
      emotions: [{ emotion: 'sad', intensity: 6 }],
      thought: 'a thought',
      belief: 5,
      createdAt: 1,
    })

    renderWithProviders(<BackupReminder />)

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toBeInTheDocument()
  })

  it('is a quiet note, not an alert that interrupts', async () => {
    await withData()

    renderWithProviders(<BackupReminder />)

    await screen.findByRole('region', { name: 'Backup reminder' })

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('BackupReminder: the coping library does not count', () => {
  it('does not nag a new user whose library holds only items of its own', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing'))
    await addCopingItem(copingItem('say', 'This will pass'))

    renderWithProviders(<BackupReminder />)
    await settle()

    expect(reminder()).not.toBeInTheDocument()
  })

  it('still shows it once there is a mood entry or a thought record next to a library', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing'))
    await withData()

    renderWithProviders(<BackupReminder />)

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toBeInTheDocument()
  })

  it('shows it for a thought record next to a library, and not for the library alone', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing'))
    renderWithProviders(<BackupReminder />)
    await settle()
    expect(reminder()).not.toBeInTheDocument()

    await db.thoughtRecords.add({
      emotions: [{ emotion: 'sad', intensity: 6 }],
      thought: 'a thought',
      belief: 5,
      createdAt: 1,
    })

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toBeInTheDocument()
  })
})

describe('BackupReminder: when it is not shown', () => {
  it('is hidden for a new user with no data, and never flashes by', async () => {
    const { container } = renderWithProviders(<BackupReminder />)

    expect(container).toBeEmptyDOMElement()
    await settle()
    expect(reminder()).not.toBeInTheDocument()
  })

  it('is hidden after a recent backup', async () => {
    await withData()
    recordBackup(Date.now() - 3 * DAY)

    renderWithProviders(<BackupReminder />)
    await settle()

    expect(reminder()).not.toBeInTheDocument()
  })

  it('is hidden when the browser blocks its storage, so it cannot nag on every visit', async () => {
    await withData()
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    renderWithProviders(<BackupReminder />)
    await settle()

    expect(reminder()).not.toBeInTheDocument()
  })

  it('is hidden, rather than breaking the app, when the data cannot be read', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(db.moodEntries, 'count').mockRejectedValue(new Error('storage unavailable'))

    renderWithProviders(<BackupReminder />)

    await waitFor(() => {
      expect(report).toHaveBeenCalled()
    })
    expect(reminder()).not.toBeInTheDocument()
  })
})

describe('BackupReminder: "Not now"', () => {
  it('hides the reminder, puts it off for 7 days, and tells the page', async () => {
    await withData()
    const onSnoozed = vi.fn()
    renderWithProviders(<BackupReminder onSnoozed={onSnoozed} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Not now' }))

    expect(reminder()).not.toBeInTheDocument()
    expect(onSnoozed).toHaveBeenCalledTimes(1)

    const until = readSnoozedUntil()

    expect(until).not.toBeNull()
    expect(Math.abs((until ?? 0) - (Date.now() + SNOOZE_MS))).toBeLessThan(60_000)
  })

  it('keeps it hidden on the next visit while the 7 days last', async () => {
    await withData()
    snoozeBackupReminder(Date.now() + 3 * DAY)

    renderWithProviders(<BackupReminder />)
    await settle()

    expect(reminder()).not.toBeInTheDocument()
  })

  it('lets it return once the 7 days have passed', async () => {
    await withData()
    snoozeBackupReminder(Date.now() - 1)

    renderWithProviders(<BackupReminder />)

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toBeInTheDocument()
  })
})

describe('BackupReminder: following the data', () => {
  it('disappears by itself when a backup is made', async () => {
    await withData()
    renderWithProviders(<BackupReminder />)
    await screen.findByRole('region', { name: 'Backup reminder' })

    act(() => {
      recordBackup()
    })

    expect(reminder()).not.toBeInTheDocument()
  })

  it('appears by itself once the first data is added', async () => {
    renderWithProviders(<BackupReminder />)
    await settle()
    expect(reminder()).not.toBeInTheDocument()

    await withData()

    expect(await screen.findByRole('region', { name: 'Backup reminder' })).toBeInTheDocument()
  })
})

describe('BackupReminder: "Back up now"', () => {
  it('links to Settings, where the backup is made', async () => {
    await withData()

    renderWithProviders(<BackupReminder />)

    expect(await screen.findByRole('link', { name: 'Back up now' })).toHaveAttribute(
      'href',
      '/settings',
    )
  })
})
