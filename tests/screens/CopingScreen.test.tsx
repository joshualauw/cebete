import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { addCopingItem } from '@/coping/repository'
import { db } from '@/db/db'
import CopingScreen from '@/screens/CopingScreen'
import { copingItem, fillForm, save } from '@tests/helpers/coping'
import { renderWithProviders } from '@tests/helpers/render'

beforeEach(async () => {
  await db.copingItems.clear()
})

function openAddForm(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Add an item' }))
}

function editButton(text: string): HTMLElement {
  return screen.getByRole('button', { name: `Edit “${text}”` })
}

describe('CopingScreen: the list', () => {
  it('has the Coping library heading, and leaves going back to the browser or phone back button', async () => {
    renderWithProviders(<CopingScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'Coping library' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Back to home' })).not.toBeInTheDocument()
    expect(await screen.findByText(/no items yet/i)).toBeInTheDocument()
  })

  it('lists the stored items under the heading', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing', 'In for 4, out for 6'))

    renderWithProviders(<CopingScreen />)

    expect(await screen.findByText('Slow breathing')).toBeInTheDocument()
    expect(screen.getByText('In for 4, out for 6')).toBeInTheDocument()
  })

  it('invites the first item with an Add an item button, also when the library is empty', async () => {
    renderWithProviders(<CopingScreen />)

    await screen.findByText(/no items yet/i)

    expect(screen.getByRole('button', { name: 'Add an item' })).toBeEnabled()
  })
})

describe('CopingScreen: adding an item', () => {
  it('opens the form in place of the button and shows the new item under its group', async () => {
    renderWithProviders(<CopingScreen />)
    await screen.findByText(/no items yet/i)

    openAddForm()

    expect(screen.getByRole('heading', { name: 'New item' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add an item' })).not.toBeInTheDocument()

    fillForm({ type: 'say', text: 'This will pass' })
    save()

    const group = await screen.findByRole('region', { name: 'Tell myself' })

    expect(within(group).getByText('This will pass')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'New item' })).not.toBeInTheDocument()
    expect(screen.queryByText(/no items yet/i)).not.toBeInTheDocument()
  })

  it('announces the save politely, and gives focus back to Add an item', async () => {
    renderWithProviders(<CopingScreen />)
    await screen.findByText(/no items yet/i)

    openAddForm()
    fillForm({ type: 'do', text: 'Walk' })
    save()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add an item' })).toHaveFocus()
    })
    expect(
      screen.getAllByRole('status').some((status) => status.textContent === 'Item saved.'),
    ).toBe(true)
  })

  it('saves nothing when cancelled, and gives focus back to Add an item', async () => {
    renderWithProviders(<CopingScreen />)
    await screen.findByText(/no items yet/i)

    openAddForm()
    fillForm({ type: 'do', text: 'Walk' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('button', { name: 'Add an item' })).toHaveFocus()
    expect(await db.copingItems.count()).toBe(0)
  })

  it('puts items in their groups whatever order they were added in', async () => {
    renderWithProviders(<CopingScreen />)
    await screen.findByText(/no items yet/i)

    for (const [type, text] of [
      ['about', 'Good listener'],
      ['do', 'Walk'],
    ] as const) {
      openAddForm()
      fillForm({ type, text })
      save()
      await screen.findByText(text)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add an item' })).toBeInTheDocument()
      })
    }

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(['Do', 'About me'])
  })
})

describe('CopingScreen: editing an item in place', () => {
  it('opens the form where the item was, filled in, and updates it on save', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing', 'In for 4'))
    await addCopingItem(copingItem('do', 'Walk'))
    renderWithProviders(<CopingScreen />)
    await screen.findByText('Slow breathing')

    fireEvent.click(editButton('Slow breathing'))

    expect(screen.getByRole('heading', { name: 'Edit item' })).toBeInTheDocument()
    fillForm({ text: 'Box breathing' })
    save()

    const group = await screen.findByRole('region', { name: 'Do' })

    await waitFor(() => {
      expect(
        within(group)
          .getAllByRole('listitem')
          .map((row) => row.textContent),
      ).toEqual([expect.stringContaining('Box breathing'), expect.stringContaining('Walk')])
    })
    expect(screen.queryByRole('heading', { name: 'Edit item' })).not.toBeInTheDocument()
  })

  it('announces the update politely, and gives focus back to the item’s Edit action', async () => {
    await addCopingItem(copingItem('do', 'Walk'))
    renderWithProviders(<CopingScreen />)
    await screen.findByText('Walk')

    fireEvent.click(editButton('Walk'))
    fillForm({ text: 'Long walk' })
    save()

    await waitFor(() => {
      expect(editButton('Long walk')).toHaveFocus()
    })
    expect(
      screen.getAllByRole('status').some((status) => status.textContent === 'Item updated.'),
    ).toBe(true)
  })

  it('moves an item to its new group when its kind changes', async () => {
    await addCopingItem(copingItem('do', 'Calm card'))
    renderWithProviders(<CopingScreen />)
    await screen.findByText('Calm card')

    fireEvent.click(editButton('Calm card'))
    fillForm({ type: 'say' })
    save()

    const group = await screen.findByRole('region', { name: 'Tell myself' })

    expect(within(group).getByText('Calm card')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Do' })).not.toBeInTheDocument()
  })

  it('leaves the item as it was when cancelled', async () => {
    await addCopingItem(copingItem('do', 'Walk'))
    renderWithProviders(<CopingScreen />)
    await screen.findByText('Walk')

    fireEvent.click(editButton('Walk'))
    fillForm({ text: 'Changed my mind' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.getByText('Walk')).toBeInTheDocument()
    expect(editButton('Walk')).toHaveFocus()
  })
})

describe('CopingScreen: one form at a time', () => {
  it('switches Add an item and every Edit off while an item is being edited', async () => {
    await addCopingItem(copingItem('do', 'Walk'))
    await addCopingItem(copingItem('say', 'This will pass'))
    renderWithProviders(<CopingScreen />)
    await screen.findByText('Walk')

    fireEvent.click(editButton('Walk'))

    expect(screen.getByRole('button', { name: 'Add an item' })).toBeDisabled()
    expect(editButton('This will pass')).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add an item' })).toBeEnabled()
    })
    expect(editButton('This will pass')).toBeEnabled()
  })

  it('switches every Edit off while a new item is being added', async () => {
    await addCopingItem(copingItem('do', 'Walk'))
    renderWithProviders(<CopingScreen />)
    await screen.findByText('Walk')

    openAddForm()

    expect(editButton('Walk')).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(editButton('Walk')).toBeEnabled()
  })
})
