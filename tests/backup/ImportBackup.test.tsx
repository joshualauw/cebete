import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { formatBackupDate } from '@/backup/describe'
import ImportBackup from '@/backup/ImportBackup'
import { db } from '@/db/db'
import MoodList from '@/mood/MoodList'
import { addMoodEntry } from '@/mood/repository'
import { backupText, currentEntry, legacyEntry } from '@tests/helpers/backup'
import { oneEmotion } from '@tests/helpers/mood'
import { renderWithProviders } from '@tests/helpers/render'

const QUESTION = { name: 'Replace your data with this backup' }

beforeEach(async () => {
  await db.moodEntries.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function pickFile(contents: string, name = 'cebete-backup.json'): File {
  const file = new File([contents], name, { type: 'application/json' })

  fireEvent.change(screen.getByLabelText('Choose a backup file'), { target: { files: [file] } })

  return file
}

function pickExisting(file: File): void {
  fireEvent.change(screen.getByLabelText('Choose a backup file'), { target: { files: [file] } })
}

function confirm(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Yes, replace my data' }))
}

function cancel(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
}

async function seedExisting(): Promise<void> {
  await addMoodEntry({ ...oneEmotion('angry', 7), note: 'the old data' })
  await addMoodEntry(oneEmotion('lonely', 3))
}

describe('ImportBackup: choosing a file', () => {
  it('offers an Import backup button, with the file chooser itself hidden and labelled', () => {
    renderWithProviders(<ImportBackup />)

    expect(screen.getByRole('button', { name: 'Import backup' })).toBeEnabled()
    expect(screen.getByLabelText('Choose a backup file')).toHaveAttribute('type', 'file')
    expect(screen.getByLabelText('Choose a backup file')).toHaveAttribute('hidden')
  })

  it('shows a confirmation for a valid file, saying what is in it and when it was made', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())

    const question = await screen.findByRole('group', QUESTION)

    expect(within(question).getByText('Replace everything on this device?')).toBeInTheDocument()
    expect(question).toHaveTextContent(
      `This backup was made on ${formatBackupDate('2026-11-24T10:00:00.000Z')} and holds 2 mood entries.`,
    )
  })

  it('warns that everything is erased and cannot be undone, and suggests exporting first', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())

    const question = await screen.findByRole('group', QUESTION)

    expect(question).toHaveTextContent(/erased and replaced/i)
    expect(question).toHaveTextContent(/cannot be undone/i)
    expect(question).toHaveTextContent(/export it first/i)
  })

  it('changes nothing on the device while it asks', async () => {
    await seedExisting()
    const before = await db.moodEntries.toArray()
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)

    expect(await db.moodEntries.toArray()).toEqual(before)
  })

  it('puts focus on the safe choice, Cancel', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)

    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
  })

  it('keeps Import switched off while the question is open', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)

    expect(screen.getByRole('button', { name: 'Import backup' })).toBeDisabled()
  })

  it('says "no entries" for a backup that holds none', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText({ tables: { moodEntries: [] } }))

    expect(await screen.findByRole('group', QUESTION)).toHaveTextContent(/holds no entries\./)
  })

  it('does nothing when the file chooser is closed without choosing a file', () => {
    renderWithProviders(<ImportBackup />)

    fireEvent.change(screen.getByLabelText('Choose a backup file'), { target: { files: [] } })

    expect(screen.queryByRole('group', QUESTION)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import backup' })).toBeEnabled()
  })
})

describe('ImportBackup: Cancel', () => {
  it('closes the question and leaves the data exactly as it was', async () => {
    await seedExisting()
    const before = await db.moodEntries.toArray()
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    cancel()

    expect(screen.queryByRole('group', QUESTION)).not.toBeInTheDocument()
    expect(await db.moodEntries.toArray()).toEqual(before)
  })

  it('gives focus back to the Import button, and says nothing', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    cancel()

    expect(screen.getByRole('button', { name: 'Import backup' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Import backup' })).toBeEnabled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('lets the same file be chosen again afterwards', async () => {
    renderWithProviders(<ImportBackup />)

    const file = pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    cancel()
    pickExisting(file)

    expect(await screen.findByRole('group', QUESTION)).toBeInTheDocument()
  })
})

describe('ImportBackup: confirming', () => {
  it('makes the data on the device match the backup, replacing what was there', async () => {
    await seedExisting()
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    confirm()
    await screen.findByText(/your data was restored/i)

    const rows = await db.moodEntries.orderBy('id').toArray()

    expect(rows).toEqual([currentEntry(1), currentEntry(2, 'sad', 7)])
  })

  it('shows a calm success message with how many entries were restored', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    confirm()

    expect(
      await screen.findByText('Your data was restored with 2 mood entries.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/your data was restored/i)
  })

  it('closes the question, and gives focus back to Import', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    confirm()
    await screen.findByText(/your data was restored/i)

    expect(screen.queryByRole('group', QUESTION)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import backup' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Import backup' })).toHaveFocus()
  })

  it('can restore a backup that holds no entries, which empties the device', async () => {
    await seedExisting()
    renderWithProviders(<ImportBackup />)

    pickFile(backupText({ tables: { moodEntries: [] } }))
    await screen.findByRole('group', QUESTION)
    confirm()

    expect(await screen.findByText(/held no entries/i)).toBeInTheDocument()
    expect(await db.moodEntries.count()).toBe(0)
  })

  it('restores a backup in the old version 2 layout, in the new layout', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile(
      backupText({
        version: 2,
        tables: { moodEntries: [legacyEntry(1, 'sad', 4), legacyEntry(2, 'happy', 92)] },
      }),
    )
    await screen.findByRole('group', QUESTION)
    confirm()
    await screen.findByText(/your data was restored/i)

    const rows = await db.moodEntries.orderBy('id').toArray()

    expect(rows.map((row) => row.emotions)).toEqual([
      [{ emotion: 'sad', intensity: 0 }],
      [{ emotion: 'happy', intensity: 9 }],
    ])
  })

  it('updates the Mood list by itself once the data is replaced', async () => {
    await addMoodEntry(oneEmotion('angry', 7))
    renderWithProviders(
      <>
        <ImportBackup />
        <MoodList />
      </>,
    )
    await screen.findByText('Angry')

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    confirm()

    expect(await screen.findByText('Sad')).toBeInTheDocument()
    expect(await screen.findByText('Calm')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('Angry')).not.toBeInTheDocument()
    })
  })
})

describe('ImportBackup: files that are refused', () => {
  it.each([
    ['an empty file', '', /not a cebete backup/],
    ['text that is not JSON', 'this is not json', /not a cebete backup/],
    ['JSON that is not a backup', '{"hello":"world"}', /not a cebete backup/],
    ['a backup from a newer version', backupText({ version: 99 }), /newer version of cebete/],
    [
      'a damaged backup',
      backupText({ tables: { moodEntries: [currentEntry(1), { id: 2 }] } }),
      /damaged/,
    ],
    [
      'a backup with entries that share an id',
      backupText({ tables: { moodEntries: [currentEntry(1), currentEntry(1)] } }),
      /damaged/,
    ],
  ])('shows a clear message for %s, and changes nothing', async (_label, contents, wording) => {
    await seedExisting()
    const before = await db.moodEntries.toArray()
    renderWithProviders(<ImportBackup />)

    pickFile(contents)

    expect(await screen.findByRole('alert')).toHaveTextContent(wording)
    expect(screen.queryByRole('group', QUESTION)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import backup' })).toBeEnabled()
    expect(await db.moodEntries.toArray()).toEqual(before)
  })

  it('clears the message when a valid file is chosen next', async () => {
    renderWithProviders(<ImportBackup />)

    pickFile('not a backup')
    await screen.findByRole('alert')
    pickFile(backupText())

    expect(await screen.findByRole('group', QUESTION)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('ImportBackup: when the replacement fails', () => {
  it('keeps the previous data, says so, and keeps the question open to try again', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await seedExisting()
    const before = await db.moodEntries.toArray()
    vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('storage unavailable'))
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    confirm()

    const alert = await screen.findByRole('alert')

    expect(alert).toHaveTextContent(/nothing was changed/i)
    expect(alert).toHaveTextContent(/current data is still here/i)
    expect(screen.getByRole('group', QUESTION)).toBeInTheDocument()
    expect(await db.moodEntries.toArray()).toEqual(before)
    expect(report).toHaveBeenCalled()
  })

  it('lets the user try again, and the retry restores the backup', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await seedExisting()
    vi.spyOn(db, 'transaction').mockRejectedValueOnce(new Error('storage unavailable'))
    renderWithProviders(<ImportBackup />)

    pickFile(backupText())
    await screen.findByRole('group', QUESTION)
    confirm()
    await screen.findByRole('alert')

    expect(screen.getByRole('button', { name: 'Yes, replace my data' })).toBeEnabled()

    confirm()

    expect(await screen.findByText(/your data was restored/i)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect((await db.moodEntries.toArray()).map((row) => row.id).sort()).toEqual([1, 2])
  })
})
