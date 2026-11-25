import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CopingForm from '@/coping/CopingForm'
import {
  COPING_TYPE_LABELS,
  COPING_TYPES,
  DETAIL_MAX_LENGTH,
  TEXT_MAX_LENGTH,
} from '@/coping/types'
import { db } from '@/db/db'
import { detailField, fillForm, save, textField } from '@tests/helpers/coping'
import { renderWithProviders } from '@tests/helpers/render'

beforeEach(async () => {
  await db.copingItems.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function saveButton(): HTMLElement {
  return screen.getByRole('button', { name: 'Save' })
}

describe('CopingForm: adding an item', () => {
  it('opens under its own title, with focus on it and nothing chosen', () => {
    renderWithProviders(<CopingForm onDone={() => undefined} />)

    const title = screen.getByRole('heading', { name: 'New item' })

    expect(title).toHaveFocus()
    expect(screen.getAllByRole('radio')).toHaveLength(4)
    for (const radio of screen.getAllByRole('radio')) {
      expect(radio).not.toBeChecked()
    }
    expect(textField()).toHaveValue('')
  })

  it('offers the four kinds with their names', () => {
    renderWithProviders(<CopingForm onDone={() => undefined} />)

    for (const type of COPING_TYPES) {
      expect(screen.getByRole('radio', { name: COPING_TYPE_LABELS[type] })).toBeInTheDocument()
    }
  })

  it('shows a short example of the chosen kind', () => {
    renderWithProviders(<CopingForm onDone={() => undefined} />)

    fillForm({ type: 'say' })

    expect(screen.getByText(/this will pass/i)).toBeInTheDocument()
  })

  it('keeps Save off, with a hint, until a kind is chosen and a text is written', () => {
    renderWithProviders(<CopingForm onDone={() => undefined} />)

    expect(saveButton()).toBeDisabled()
    expect(screen.getByText(/choose a kind and write a short text/i)).toBeInTheDocument()

    fillForm({ type: 'do' })
    expect(saveButton()).toBeDisabled()

    fillForm({ text: '   ' })
    expect(saveButton()).toBeDisabled()

    fillForm({ text: 'Slow breathing' })
    expect(saveButton()).toBeEnabled()
    expect(screen.queryByText(/choose a kind and write a short text/i)).not.toBeInTheDocument()
  })

  it('does not need a kind chosen again when only the text is cleared', () => {
    renderWithProviders(<CopingForm onDone={() => undefined} />)

    fillForm({ type: 'do', text: 'Walk' })
    fillForm({ text: '' })

    expect(saveButton()).toBeDisabled()
    expect(screen.getByRole('radio', { name: 'Do' })).toBeChecked()
  })

  it.each(COPING_TYPES)('saves an item of the %s kind and closes', async (type) => {
    const onDone = vi.fn()
    const onSaved = vi.fn()
    renderWithProviders(<CopingForm onDone={onDone} onSaved={onSaved} />)

    fillForm({ type, text: 'Something that helps' })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1)
    })
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect((await db.copingItems.toArray()).map(({ type: saved, text }) => [saved, text])).toEqual([
      [type, 'Something that helps'],
    ])
  })

  it('saves the detail, trimming it, and leaves a blank one out', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm onDone={onDone} />)

    fillForm({ type: 'do', text: 'Slow breathing', detail: '  In for 4, out for 6  ' })
    save()
    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1)
    })

    expect((await db.copingItems.toArray())[0]).toMatchObject({ detail: 'In for 4, out for 6' })
  })

  it('does not save a blank detail', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm onDone={onDone} />)

    fillForm({ type: 'do', text: 'Walk', detail: '   ' })
    save()
    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1)
    })

    const [row] = await db.copingItems.toArray()

    expect(row).toMatchObject({ type: 'do', text: 'Walk' })
    expect(row).not.toHaveProperty('detail')
  })

  it('shows a counter for the text and the detail', () => {
    renderWithProviders(<CopingForm onDone={() => undefined} />)

    expect(screen.getByText(`0/${String(TEXT_MAX_LENGTH)}`)).toBeInTheDocument()
    expect(screen.getByText(`0/${String(DETAIL_MAX_LENGTH)}`)).toBeInTheDocument()

    fillForm({ text: 'Walk', detail: 'To the park' })

    expect(screen.getByText(`4/${String(TEXT_MAX_LENGTH)}`)).toBeInTheDocument()
    expect(screen.getByText(`11/${String(DETAIL_MAX_LENGTH)}`)).toBeInTheDocument()
    expect(textField()).toHaveAttribute('maxlength', String(TEXT_MAX_LENGTH))
    expect(detailField()).toHaveAttribute('maxlength', String(DETAIL_MAX_LENGTH))
  })

  it('explains a text that is too long in plain words, saves nothing, and keeps what was typed', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm onDone={onDone} />)

    fillForm({ type: 'do', text: 'a'.repeat(TEXT_MAX_LENGTH + 1) })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/at most 100 characters/i)
    expect(onDone).not.toHaveBeenCalled()
    expect(textField()).toHaveValue('a'.repeat(TEXT_MAX_LENGTH + 1))
    expect(await db.copingItems.count()).toBe(0)
  })

  it('closes without saving when cancelled', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm onDone={onDone} />)

    fillForm({ type: 'do', text: 'Walk' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(await db.copingItems.count()).toBe(0)
  })
})

describe('CopingForm: when saving fails', () => {
  it('shows a calm message, keeps everything typed and the form open, and allows a retry', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const add = vi.spyOn(db.copingItems, 'add').mockRejectedValueOnce(new Error('disk full'))
    const onDone = vi.fn()
    renderWithProviders(<CopingForm onDone={onDone} />)

    fillForm({ type: 'say', text: 'This will pass', detail: 'Said slowly' })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved right now/i)
    expect(report).toHaveBeenCalled()
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'Tell myself' })).toBeChecked()
    expect(textField()).toHaveValue('This will pass')
    expect(detailField()).toHaveValue('Said slowly')
    expect(saveButton()).toBeEnabled()

    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1)
    })
    expect(add).toHaveBeenCalledTimes(2)
    expect(await db.copingItems.count()).toBe(1)
  })

  it('makes one item when Save is tapped twice', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm onDone={onDone} />)

    fillForm({ type: 'do', text: 'Walk' })
    // The button changes its name while saving, so the same button is tapped both times.
    const button = saveButton()
    fireEvent.click(button)
    fireEvent.click(button)

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled()
    })
    expect(await db.copingItems.count()).toBe(1)
  })
})
