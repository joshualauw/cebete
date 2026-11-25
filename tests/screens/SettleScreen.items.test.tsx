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

  it('puts the built-in techniques before the user’s own actions under Do', async () => {
    await addCopingItem(copingItem('do', 'Long walk'))

    renderWithProviders(<SettleScreen />)

    const own = await screen.findByText('Long walk')
    const builtIn = screen.getByRole('heading', { level: 3, name: 'Slow breathing' })

    expect(builtIn.compareDocumentPosition(own) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(
      within(screen.getByRole('region', { name: 'Do' })).getByText('Long walk'),
    ).toBeInTheDocument()
  })

  it('shows an item’s detail as its steps, and leaves out the groups with nothing in them', async () => {
    await addCopingItem(copingItem('do', 'Long walk', 'Round the park\nThen home'))

    renderWithProviders(<SettleScreen />)

    expect(await screen.findByText(/round the park/i)).toHaveTextContent('Round the park Then home')
    expect(headings()).toEqual(['Do'])
  })

  it('keeps the built-in techniques first even when the user has added none of their own actions', async () => {
    await addCopingItem(copingItem('say', 'This will pass'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('This will pass')

    expect(
      within(screen.getByRole('region', { name: 'Do' })).getByRole('heading', {
        level: 3,
        name: 'Slow breathing',
      }),
    ).toBeInTheDocument()
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
