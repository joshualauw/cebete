import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import BackupSection from '@/backup/BackupSection'
import { formatLastBackupDate } from '@/backup/describe'
import { readLastBackup, recordBackup } from '@/backup/lastBackup'
import { db } from '@/db/db'
import { backupText } from '@tests/helpers/backup'
import { captureDownloads } from '@tests/helpers/download'
import { renderWithProviders } from '@tests/helpers/render'

const EARLIER = new Date(2026, 5, 10, 14, 35).getTime()

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

describe('BackupSection: the last backup', () => {
  it('says "Never backed up" when no backup was made', () => {
    renderWithProviders(<BackupSection />)

    expect(screen.getByText('Never backed up')).toBeInTheDocument()
  })

  it('shows the day of the last backup in the user’s own date format', () => {
    recordBackup(EARLIER)

    renderWithProviders(<BackupSection />)

    expect(screen.getByText(`Last backup: ${formatLastBackupDate(EARLIER)}`)).toBeInTheDocument()
  })

  it('says it is unknown when the browser blocks its storage, and still works', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    renderWithProviders(<BackupSection />)

    expect(screen.getByText('Last backup: unknown')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeEnabled()
  })

  it('shows today’s date as soon as a backup is exported', async () => {
    renderWithProviders(<BackupSection />)

    exportBackup()

    expect(
      await screen.findByText(`Last backup: ${formatLastBackupDate(Date.now())}`),
    ).toBeInTheDocument()
    expect(screen.queryByText('Never backed up')).not.toBeInTheDocument()
    expect(typeof readLastBackup()).toBe('number')
  })

  it('replaces an older date with the new one', async () => {
    recordBackup(EARLIER)
    renderWithProviders(<BackupSection />)

    exportBackup()

    await waitFor(() => {
      expect(
        screen.queryByText(`Last backup: ${formatLastBackupDate(EARLIER)}`),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText(`Last backup: ${formatLastBackupDate(Date.now())}`)).toBeInTheDocument()
  })

  it('does not change the date when the backup could not be made', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.spyOn(db, 'transaction').mockRejectedValue(new Error('storage unavailable'))
    recordBackup(EARLIER)
    renderWithProviders(<BackupSection />)

    exportBackup()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be created/i)
    expect(downloads.files).toHaveLength(0)
    expect(screen.getByText(`Last backup: ${formatLastBackupDate(EARLIER)}`)).toBeInTheDocument()
  })

  it('still exports when the date cannot be remembered', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })
    renderWithProviders(<BackupSection />)

    exportBackup()

    expect(await screen.findByText(/backup saved/i)).toBeInTheDocument()
    expect(downloads.files).toHaveLength(1)
    expect(screen.getByText('Never backed up')).toBeInTheDocument()
  })

  it('does not count a restore as a backup', async () => {
    recordBackup(EARLIER)
    renderWithProviders(<BackupSection />)

    const file = new File([backupText()], 'cebete-backup.json', { type: 'application/json' })

    fireEvent.change(screen.getByLabelText('Choose a backup file'), { target: { files: [file] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, replace my data' }))

    await screen.findByText(/restored/i)

    expect(readLastBackup()).toBe(EARLIER)
    expect(screen.getByText(`Last backup: ${formatLastBackupDate(EARLIER)}`)).toBeInTheDocument()
  })

  it('does not count a restore as a backup when none was ever made', async () => {
    renderWithProviders(<BackupSection />)

    const file = new File([backupText()], 'cebete-backup.json', { type: 'application/json' })

    fireEvent.change(screen.getByLabelText('Choose a backup file'), { target: { files: [file] } })
    fireEvent.click(await screen.findByRole('button', { name: 'Yes, replace my data' }))

    await screen.findByText(/restored/i)

    expect(screen.getByText('Never backed up')).toBeInTheDocument()
  })
})
