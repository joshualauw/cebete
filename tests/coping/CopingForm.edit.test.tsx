import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import CopingForm from '@/coping/CopingForm'
import { addCopingItem, deleteCopingItem } from '@/coping/repository'
import type { CopingItem } from '@/coping/types'
import { db } from '@/db/db'
import { copingItem, detailField, fillForm, save, textField } from '@tests/helpers/coping'
import { renderWithProviders } from '@tests/helpers/render'

let item: CopingItem

beforeEach(async () => {
  await db.copingItems.clear()
  item = await addCopingItem(copingItem('do', 'Slow breathing', 'In for 4, out for 6'))
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function stored(): Promise<CopingItem | undefined> {
  return db.copingItems.get(item.id)
}

describe('CopingForm: editing an item', () => {
  it('opens filled with the item, under its own title', () => {
    renderWithProviders(<CopingForm item={item} onDone={() => undefined} />)

    expect(screen.getByRole('heading', { name: 'Edit item' })).toHaveFocus()
    expect(screen.getByRole('radio', { name: 'Do' })).toBeChecked()
    expect(textField()).toHaveValue('Slow breathing')
    expect(detailField()).toHaveValue('In for 4, out for 6')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
  })

  it('saves the changes to the same item and closes', async () => {
    const onDone = vi.fn()
    const onSaved = vi.fn()
    renderWithProviders(<CopingForm item={item} onDone={onDone} onSaved={onSaved} />)

    fillForm({ text: 'Box breathing', detail: 'Four sides of four' })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalledTimes(1)
    })
    expect(onSaved).toHaveBeenCalledTimes(1)
    expect(await stored()).toEqual({
      id: item.id,
      type: 'do',
      text: 'Box breathing',
      detail: 'Four sides of four',
    })
    expect(await db.copingItems.count()).toBe(1)
  })

  it('can change the kind of the item', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm item={item} onDone={onDone} />)

    fillForm({ type: 'nearby' })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled()
    })
    expect((await stored())?.type).toBe('nearby')
  })

  it('removes a detail that was cleared', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm item={item} onDone={onDone} />)

    fillForm({ detail: '' })
    save()

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled()
    })
    expect(await stored()).toEqual({ id: item.id, type: 'do', text: 'Slow breathing' })
  })

  it('leaves the item untouched when cancelled', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm item={item} onDone={onDone} />)

    fillForm({ text: 'Something else' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onDone).toHaveBeenCalledTimes(1)
    expect(await stored()).toEqual(item)
  })

  it('keeps Save off when the text is cleared', () => {
    renderWithProviders(<CopingForm item={item} onDone={() => undefined} />)

    fillForm({ text: '' })

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})

describe('CopingForm: an item deleted while its form is open', () => {
  it('says so, offers only Cancel, and never recreates the item', async () => {
    const onDone = vi.fn()
    renderWithProviders(<CopingForm item={item} onDone={onDone} />)
    await deleteCopingItem(item.id)

    fillForm({ text: 'Too late' })
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/no longer exists/i)
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(onDone).not.toHaveBeenCalled()
    expect(await db.copingItems.count()).toBe(0)
  })
})
