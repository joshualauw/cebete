import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import MoodForm from '@/mood/MoodForm'
import { addMoodEntry } from '@/mood/repository'
import { InvalidMoodEntryError } from '@/mood/validation'
import { renderWithProviders } from '@tests/helpers/render'

// Replace the real save, so the tests can make it fail the way a blocked storage would.
vi.mock('@/mood/repository', () => ({ addMoodEntry: vi.fn() }))

const saveFn = vi.mocked(addMoodEntry)

function fillForm(): void {
  fireEvent.click(screen.getByRole('checkbox', { name: 'Anxious' }))
  fireEvent.click(screen.getByRole('checkbox', { name: 'Hopeful' }))
  fireEvent.change(screen.getByRole('slider', { name: 'Anxious intensity' }), {
    target: { value: '7' },
  })
  fireEvent.change(screen.getByRole('slider', { name: 'Hopeful intensity' }), {
    target: { value: '4' },
  })
  fireEvent.change(screen.getByRole('textbox', { name: /note/i }), {
    target: { value: 'before the meeting' },
  })
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

afterEach(() => {
  vi.restoreAllMocks()
  saveFn.mockReset()
})

describe('MoodForm: when saving fails', () => {
  it('shows a calm message, stays open, and keeps everything the user chose and typed', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    saveFn.mockRejectedValueOnce(new Error('storage unavailable'))
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    fillForm()
    save()

    const message = await screen.findByRole('alert')

    expect(message).toHaveTextContent(/could not be saved/i)
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Anxious' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Hopeful' })).toBeChecked()
    expect(screen.getByRole('slider', { name: 'Anxious intensity' })).toHaveValue('7')
    expect(screen.getByRole('slider', { name: 'Hopeful intensity' })).toHaveValue('4')
    expect(screen.getByRole('textbox', { name: /note/i })).toHaveValue('before the meeting')
    expect(report).toHaveBeenCalled()
  })

  it('lets the user try again, and closes once the retry works', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    saveFn.mockRejectedValueOnce(new Error('storage unavailable'))
    saveFn.mockResolvedValueOnce({
      id: 1,
      emotions: [{ emotion: 'anxious', intensity: 7 }],
      note: 'before the meeting',
      createdAt: 1,
    })
    const onDone = vi.fn()
    renderWithProviders(<MoodForm onDone={onDone} />)

    fillForm()
    save()
    await screen.findByRole('alert')

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()

    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledOnce()
    })
    expect(saveFn).toHaveBeenCalledTimes(2)
  })

  it('passes along exactly what the user chose, in the order chosen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    saveFn.mockRejectedValueOnce(new Error('storage unavailable'))
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    fillForm()
    save()
    await screen.findByRole('alert')

    expect(saveFn).toHaveBeenCalledExactlyOnceWith({
      emotions: [
        { emotion: 'anxious', intensity: 7 },
        { emotion: 'hopeful', intensity: 4 },
      ],
      note: 'before the meeting',
    })
  })

  it('shows the reason in plain words when an entry breaks a rule', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    saveFn.mockRejectedValueOnce(
      new InvalidMoodEntryError('note', 'The note can be at most 500 characters.'),
    )
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    fillForm()
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The note can be at most 500 characters.',
    )
    // A rule being broken is expected, not a fault, so it is not reported as an error.
    expect(report).not.toHaveBeenCalled()
  })

  it('clears the message when the user tries again', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    saveFn.mockRejectedValueOnce(new Error('storage unavailable'))
    saveFn.mockReturnValueOnce(new Promise(() => undefined))
    renderWithProviders(<MoodForm onDone={() => undefined} />)

    fillForm()
    save()
    await screen.findByRole('alert')

    save()

    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
  })
})
