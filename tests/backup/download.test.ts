import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { backupFileName, downloadTextFile } from '@/backup/download'
import { captureDownloads } from '@tests/helpers/download'

describe('backupFileName', () => {
  it('puts the day in the name, so backups sort by date', () => {
    expect(backupFileName(new Date(2026, 10, 24))).toBe('cebete-backup-2026-11-24.json')
  })

  it('pads the month and the day with a zero', () => {
    expect(backupFileName(new Date(2026, 0, 5))).toBe('cebete-backup-2026-01-05.json')
  })

  it('uses the day in the user own time zone, not the UTC day', () => {
    // Late in the evening locally, which may already be the next day in UTC.
    expect(backupFileName(new Date(2026, 11, 31, 23, 30))).toBe('cebete-backup-2026-12-31.json')
  })
})

describe('downloadTextFile', () => {
  let downloads: ReturnType<typeof captureDownloads>

  beforeEach(() => {
    downloads = captureDownloads()
  })

  afterEach(() => {
    downloads.stop()
    vi.useRealTimers()
  })

  it('downloads one file with the given name and exactly the given text', async () => {
    downloadTextFile('backup.json', '{"hello":"world"}')

    expect(downloads.files).toHaveLength(1)
    expect(downloads.files[0]?.name).toBe('backup.json')
    expect(await downloads.files[0]?.blob.text()).toBe('{"hello":"world"}')
  })

  it('makes the file a JSON file', () => {
    downloadTextFile('backup.json', '{}')

    expect(downloads.files[0]?.blob.type).toBe('application/json')
  })

  it('leaves no link behind on the page', () => {
    downloadTextFile('backup.json', '{}')

    expect(document.querySelector('a[download]')).toBeNull()
  })

  it('releases the temporary address a little later', () => {
    vi.useFakeTimers()

    downloadTextFile('backup.json', '{}')

    expect(downloads.revoked).toEqual([])

    vi.advanceTimersByTime(10_000)

    expect(downloads.revoked).toHaveLength(1)
  })
})
