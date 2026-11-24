import { fireEvent, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ExportBackup from '@/backup/ExportBackup'
import { parseBackup } from '@/backup/parse'
import { db } from '@/db/db'
import { addMoodEntry } from '@/mood/repository'
import { captureDownloads } from '@tests/helpers/download'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

let downloads: ReturnType<typeof captureDownloads>

beforeEach(async () => {
  await db.moodEntries.clear()
  downloads = captureDownloads()
})

afterEach(() => {
  downloads.stop()
  vi.restoreAllMocks()
})

function exportBackup(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Export backup' }))
}

describe('ExportBackup', () => {
  it('offers an Export backup button', () => {
    renderWithProviders(<ExportBackup />)

    expect(screen.getByRole('button', { name: 'Export backup' })).toBeEnabled()
    expect(downloads.files).toHaveLength(0)
  })

  it('downloads one file, named with the date', async () => {
    renderWithProviders(<ExportBackup />)

    exportBackup()
    await screen.findByText(/backup saved/i)

    expect(downloads.files).toHaveLength(1)
    expect(downloads.files[0]?.name).toMatch(/^cebete-backup-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('puts all the entries in the file, ready to be restored', async () => {
    const first = await addMoodEntry({ ...oneEmotion('calm', 4), note: 'a quiet morning' })
    const second = await addMoodEntry({
      emotions: [
        { emotion: 'sad', intensity: 2 },
        { emotion: 'hopeful', intensity: 6 },
      ],
    })
    renderWithProviders(<ExportBackup />)

    exportBackup()
    await screen.findByText(/backup saved/i)

    const backup = parseBackup((await downloads.files[0]?.blob.text()) ?? '')

    expect(backup.counts).toEqual({ moodEntries: 2 })
    expect(backup.tables.moodEntries).toContainEqual(first)
    expect(backup.tables.moodEntries).toContainEqual(second)
  })

  it('says how many entries were saved', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    await addMoodEntry(oneEmotion('sad', 2))
    renderWithProviders(<ExportBackup />)

    exportBackup()

    expect(await screen.findByText('Backup saved with 2 mood entries.')).toBeInTheDocument()
  })

  it('says so when there was nothing to back up, and still downloads a valid file', async () => {
    renderWithProviders(<ExportBackup />)

    exportBackup()

    expect(await screen.findByText(/nothing to back up yet/i)).toBeInTheDocument()
    expect(parseBackup((await downloads.files[0]?.blob.text()) ?? '').counts).toEqual({
      moodEntries: 0,
    })
  })

  it('tells the user about entries it could not read and left out', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    await db.table('moodEntries').add({ createdAt: 10, intensity: 3 })
    renderWithProviders(<ExportBackup />)

    exportBackup()

    expect(
      await screen.findByText(
        'Backup saved with 1 mood entry. 1 entry could not be read, so it was left out.',
      ),
    ).toBeInTheDocument()
  })

  it('announces the result politely', async () => {
    renderWithProviders(<ExportBackup />)

    exportBackup()
    await screen.findByText(/backup saved/i)

    expect(screen.getByRole('status')).toHaveTextContent(/backup saved/i)
  })

  it('changes nothing on the device', async () => {
    await addMoodEntry(oneEmotion('calm', 4))
    const before = await db.moodEntries.toArray()
    renderWithProviders(<ExportBackup />)

    exportBackup()
    await screen.findByText(/backup saved/i)

    expect(await db.moodEntries.toArray()).toEqual(before)
  })

  it('can be used again, making a second file', async () => {
    renderWithProviders(<ExportBackup />)

    exportBackup()
    await screen.findByText(/backup saved/i)
    exportBackup()
    await vi.waitFor(() => {
      expect(downloads.files).toHaveLength(2)
    })
  })
})
