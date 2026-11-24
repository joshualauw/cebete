import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ExportBackup from '@/backup/ExportBackup'
import { createBackup, serializeBackup } from '@/backup/export'
import { captureDownloads } from '@tests/helpers/download'
import { renderWithProviders } from '@tests/helpers/render'

// Replace the real export, so the tests can make it fail the way a blocked storage would.
vi.mock('@/backup/export', () => ({ createBackup: vi.fn(), serializeBackup: vi.fn() }))

const createFn = vi.mocked(createBackup)
const serializeFn = vi.mocked(serializeBackup)

let downloads: ReturnType<typeof captureDownloads>

beforeEach(() => {
  downloads = captureDownloads()
})

afterEach(() => {
  downloads.stop()
  vi.restoreAllMocks()
  createFn.mockReset()
  serializeFn.mockReset()
})

function exportBackup(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Export backup' }))
}

describe('ExportBackup: when the backup cannot be made', () => {
  it('shows a calm message, downloads nothing, and can be tried again', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    createFn.mockRejectedValueOnce(new Error('storage unavailable'))
    renderWithProviders(<ExportBackup />)

    exportBackup()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be created/i)
    expect(downloads.files).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeEnabled()
    expect(report).toHaveBeenCalled()
  })

  it('clears the message once a later try works', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    createFn.mockRejectedValueOnce(new Error('storage unavailable'))
    createFn.mockResolvedValueOnce({
      file: { app: 'cebete', version: 3, exportedAt: '2026-11-24T10:00:00.000Z', tables: {} },
      counts: { moodEntries: 2 },
      skipped: 0,
    })
    serializeFn.mockReturnValueOnce('{}')
    renderWithProviders(<ExportBackup />)

    exportBackup()
    await screen.findByRole('alert')
    exportBackup()

    expect(await screen.findByText('Backup saved with 2 mood entries.')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(downloads.files).toHaveLength(1)
  })

  it('switches the button off while the backup is being made', async () => {
    createFn.mockReturnValueOnce(new Promise(() => undefined))
    renderWithProviders(<ExportBackup />)

    exportBackup()

    const busy = await screen.findByRole('button', { name: 'Exporting…' })

    expect(busy).toBeDisabled()
    await waitFor(() => {
      expect(downloads.files).toHaveLength(0)
    })
  })
})
