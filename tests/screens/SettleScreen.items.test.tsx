import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { addCopingItem, deleteCopingItem } from '@/coping/repository'
import { db } from '@/db/db'
import SettleScreen from '@/screens/SettleScreen'
import { copingItem } from '@tests/helpers/coping'
import { renderWithProviders } from '@tests/helpers/render'

beforeEach(async () => {
  await db.copingItems.clear()
})

function headings(): (string | null)[] {
  return screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
}

describe('SettleScreen: every item has one look', () => {
  it('gives an item a card with a green title and its detail inside', async () => {
    await addCopingItem(copingItem('do', 'Long walk', 'Round the park'))

    renderWithProviders(<SettleScreen />)

    const title = await screen.findByRole('heading', { level: 3, name: 'Long walk' })

    expect(title.closest('li')).toHaveTextContent('Round the park')
  })

  it('gives every kind of item the same title size and card, Tell myself included', async () => {
    await addCopingItem(copingItem('do', 'Long walk'))
    await addCopingItem(copingItem('nearby', 'Photo of my sister'))
    await addCopingItem(copingItem('say', 'This will pass'))
    await addCopingItem(copingItem('about', 'Good listener'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('Good listener')

    const first = screen.getByRole('heading', { level: 3, name: 'Long walk' })

    for (const title of ['Photo of my sister', 'This will pass', 'Good listener']) {
      const heading = screen.getByRole('heading', { level: 3, name: title })

      // Equal generated classes mean equal style properties, so the same size and the same card.
      expect(heading.className).toBe(first.className)
      expect(heading.closest('li')?.className).toBe(first.closest('li')?.className)
    }
  })

  it('gives every kind of item a title heading, in its own group', async () => {
    await addCopingItem(copingItem('nearby', 'Photo of my sister'))
    await addCopingItem(copingItem('say', 'This will pass'))
    await addCopingItem(copingItem('about', 'Good listener'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('Good listener')

    for (const [group, title] of [
      ['Keep nearby', 'Photo of my sister'],
      ['Tell myself', 'This will pass'],
      ['Remember', 'Good listener'],
    ] as const) {
      expect(
        within(screen.getByRole('region', { name: group })).getByRole('heading', {
          level: 3,
          name: title,
        }),
      ).toBeInTheDocument()
    }
  })

  it('keeps the detail of an item in the same card, after its title, whatever its length', async () => {
    await addCopingItem(copingItem('do', 'Box breathing', 'In for 4\nHold for 4\nOut for 4'))

    renderWithProviders(<SettleScreen />)

    const card = (await screen.findByRole('heading', { level: 3, name: 'Box breathing' })).closest(
      'li',
    )

    expect(card).toHaveTextContent('In for 4')
    expect(card).toHaveTextContent('Out for 4')
  })
})

describe('SettleScreen: the user’s own items', () => {
  it('shows them in four groups, in a fixed order, with About me labelled Remember', async () => {
    await addCopingItem(copingItem('about', 'Good listener'))
    await addCopingItem(copingItem('say', 'This will pass'))
    await addCopingItem(copingItem('nearby', 'Photo of my sister'))
    await addCopingItem(copingItem('do', 'Long walk'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('Good listener')

    expect(headings()).toEqual(['Do', 'Keep nearby', 'Tell myself', 'Remember'])
    expect(screen.queryByText('About me')).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Remember' })).getByText('Good listener'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Tell myself' })).getByText('This will pass'),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Keep nearby' })).getByText('Photo of my sister'),
    ).toBeInTheDocument()
  })

  it('lists the actions under Do in the order they were added', async () => {
    await addCopingItem(copingItem('do', 'First'))
    await addCopingItem(copingItem('do', 'Second'))

    renderWithProviders(<SettleScreen />)

    const rows = within(await screen.findByRole('region', { name: 'Do' })).getAllByRole('listitem')

    expect(rows[0]).toHaveTextContent('First')
    expect(rows[1]).toHaveTextContent('Second')
  })

  it('shows an item’s detail as its steps, and leaves out the groups with nothing in them', async () => {
    await addCopingItem(copingItem('do', 'Long walk', 'Round the park\nThen home'))

    renderWithProviders(<SettleScreen />)

    expect(await screen.findByText(/round the park/i)).toHaveTextContent('Round the park Then home')
    expect(headings()).toEqual(['Do'])
  })

  it('shows no Do group when the user has no action, since nothing holds it open', async () => {
    await addCopingItem(copingItem('say', 'This will pass'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('This will pass')

    expect(screen.queryByRole('region', { name: 'Do' })).not.toBeInTheDocument()
    expect(headings()).toEqual(['Tell myself'])
  })

  it('does not show the prompt to add items once the user has some', async () => {
    await addCopingItem(copingItem('do', 'Long walk'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('Long walk')

    expect(screen.queryByText(/add the things that help you/i)).not.toBeInTheDocument()
  })

  it('shows changes to the library by itself, without reopening the screen', async () => {
    renderWithProviders(<SettleScreen />)
    await screen.findByText(/add the things that help you/i)

    const added = await addCopingItem(copingItem('say', 'This will pass'))

    expect(await screen.findByText('This will pass')).toBeInTheDocument()
    expect(screen.queryByText(/add the things that help you/i)).not.toBeInTheDocument()

    await deleteCopingItem(added.id)

    await waitFor(() => {
      expect(screen.queryByText('This will pass')).not.toBeInTheDocument()
    })
    expect(await screen.findByText(/add the things that help you/i)).toBeInTheDocument()
  })

  it('leaves out a damaged item without breaking the screen', async () => {
    await addCopingItem(copingItem('do', 'Long walk'))
    await db.table('copingItems').add({ type: 'sing', text: 'broken' })

    renderWithProviders(<SettleScreen />)

    expect(await screen.findByText('Long walk')).toBeInTheDocument()
    expect(screen.queryByText('broken')).not.toBeInTheDocument()
  })

  it('cannot be edited from here: there are no buttons or text fields, only links', async () => {
    await addCopingItem(copingItem('do', 'Long walk'))
    await addCopingItem(copingItem('say', 'This will pass'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('This will pass')

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
