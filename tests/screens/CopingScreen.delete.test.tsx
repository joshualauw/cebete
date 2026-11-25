import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { addCopingItem } from '@/coping/repository'
import { db } from '@/db/db'
import CopingScreen from '@/screens/CopingScreen'
import { copingItem, fillForm } from '@tests/helpers/coping'
import { renderWithProviders } from '@tests/helpers/render'

beforeEach(async () => {
  await db.copingItems.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

function deleteButton(text: string): HTMLElement {
  return screen.getByRole('button', { name: `Delete “${text}”` })
}

function editButton(text: string): HTMLElement {
  return screen.getByRole('button', { name: `Edit “${text}”` })
}

async function renderWith(...texts: string[]): Promise<void> {
  for (const text of texts) {
    await addCopingItem(copingItem('do', text))
  }
  renderWithProviders(<CopingScreen />)
  await screen.findByText(texts[0] ?? '')
}

describe('CopingScreen: deleting an item', () => {
  it('asks first, inside the item, with Keep focused', async () => {
    await renderWith('Walk')

    fireEvent.click(deleteButton('Walk'))

    const question = screen.getByRole('group', { name: 'Delete “Walk”' })

    expect(
      within(question).getByText('Delete this item? This cannot be undone.'),
    ).toBeInTheDocument()
    expect(within(question).getByRole('button', { name: 'Keep' })).toHaveFocus()
    expect(screen.getByText('Walk')).toBeInTheDocument()
  })

  it('keeps the item when the user chooses Keep, and gives focus back to Delete', async () => {
    await renderWith('Walk')

    fireEvent.click(deleteButton('Walk'))
    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    await waitFor(() => {
      expect(deleteButton('Walk')).toHaveFocus()
    })
    expect(screen.queryByText(/this cannot be undone/i)).not.toBeInTheDocument()
    expect(await db.copingItems.count()).toBe(1)
  })

  it('removes only that item when the user confirms', async () => {
    await renderWith('Walk', 'Breathe')

    fireEvent.click(deleteButton('Walk'))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(screen.queryByText('Walk')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Breathe')).toBeInTheDocument()
    expect((await db.copingItems.toArray()).map((item) => item.text)).toEqual(['Breathe'])
  })

  it('announces the delete and how many items are left, and keeps focus in the list', async () => {
    await renderWith('Walk', 'Breathe')

    fireEvent.click(deleteButton('Walk'))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(
        screen
          .getAllByRole('status')
          .some((status) => status.textContent === 'Item deleted. 1 item left.'),
      ).toBe(true)
    })
    expect(screen.getByRole('region', { name: 'Coping items' })).toHaveFocus()
  })

  it('shows the empty state, and still announces the delete, when the last item goes', async () => {
    await renderWith('Walk')

    fireEvent.click(deleteButton('Walk'))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('No items yet')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('status')
        .some((status) => status.textContent === 'Item deleted. No items left.'),
    ).toBe(true)
    expect(screen.getByRole('region', { name: 'Coping items' })).toHaveFocus()
  })

  it('keeps the question open with a calm message when deleting fails, and allows a retry', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const remove = vi.spyOn(db.copingItems, 'delete').mockRejectedValueOnce(new Error('disk full'))
    await renderWith('Walk')

    fireEvent.click(deleteButton('Walk'))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be deleted right now/i)
    expect(report).toHaveBeenCalled()
    expect(screen.getByText('Delete this item? This cannot be undone.')).toBeInTheDocument()
    expect(await db.copingItems.count()).toBe(1)

    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    await waitFor(() => {
      expect(screen.queryByText('Walk')).not.toBeInTheDocument()
    })
    expect(remove).toHaveBeenCalledTimes(2)
    expect(await db.copingItems.count()).toBe(0)
  })
})

describe('CopingScreen: one flow at a time', () => {
  it('switches Add an item, every Edit and every other Delete off while the question is open', async () => {
    await renderWith('Walk', 'Breathe')

    fireEvent.click(deleteButton('Walk'))

    expect(screen.getByRole('button', { name: 'Add an item' })).toBeDisabled()
    expect(editButton('Breathe')).toBeDisabled()
    expect(deleteButton('Breathe')).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add an item' })).toBeEnabled()
    })
    expect(editButton('Breathe')).toBeEnabled()
    expect(deleteButton('Breathe')).toBeEnabled()
  })

  it('switches every Delete off while an item is being edited', async () => {
    await renderWith('Walk', 'Breathe')

    fireEvent.click(editButton('Walk'))

    expect(deleteButton('Breathe')).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(deleteButton('Breathe')).toBeEnabled()
    })
  })

  it('switches every Delete off while a new item is being added', async () => {
    await renderWith('Walk')

    fireEvent.click(screen.getByRole('button', { name: 'Add an item' }))
    fillForm({ text: 'Something' })

    expect(deleteButton('Walk')).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(deleteButton('Walk')).toBeEnabled()
  })
})
