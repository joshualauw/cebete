import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import CopingList from '@/coping/CopingList'
import { addCopingItem } from '@/coping/repository'
import { db } from '@/db/db'
import { copingItem } from '@tests/helpers/coping'
import { renderWithProviders } from '@tests/helpers/render'

beforeEach(async () => {
  await db.copingItems.clear()
})

describe('CopingList', () => {
  it('invites the first item when there are none, instead of showing empty groups', async () => {
    renderWithProviders(<CopingList />)

    expect(await screen.findByRole('heading', { name: 'No items yet' })).toBeInTheDocument()
    expect(screen.getByText(/something to do/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Do' })).not.toBeInTheDocument()
  })

  it('shows nothing while the first read is under way, so the empty state does not flash', () => {
    const { container } = renderWithProviders(<CopingList />)

    expect(container).toBeEmptyDOMElement()
  })

  it('lists the items in four groups, in a fixed order, whatever order they were added in', async () => {
    await addCopingItem(copingItem('about', 'Good listener'))
    await addCopingItem(copingItem('say', 'This will pass'))
    await addCopingItem(copingItem('nearby', 'Photo of my sister'))
    await addCopingItem(copingItem('do', 'Slow breathing'))

    renderWithProviders(<CopingList />)

    await screen.findByText('Slow breathing')

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(['Do', 'Keep nearby', 'Tell myself', 'About me'])
  })

  it('puts each item under its own group', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing'))
    await addCopingItem(copingItem('about', 'Good listener'))

    renderWithProviders(<CopingList />)

    const doGroup = await screen.findByRole('region', { name: 'Do' })
    const aboutGroup = screen.getByRole('region', { name: 'About me' })

    expect(within(doGroup).getByText('Slow breathing')).toBeInTheDocument()
    expect(within(doGroup).queryByText('Good listener')).not.toBeInTheDocument()
    expect(within(aboutGroup).getByText('Good listener')).toBeInTheDocument()
  })

  it('leaves out a group that has no items', async () => {
    await addCopingItem(copingItem('say', 'This will pass'))

    renderWithProviders(<CopingList />)

    await screen.findByText('This will pass')

    expect(
      screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent),
    ).toEqual(['Tell myself'])
  })

  it('keeps the order added within a group', async () => {
    await addCopingItem(copingItem('do', 'First'))
    await addCopingItem(copingItem('do', 'Second'))
    await addCopingItem(copingItem('do', 'Third'))

    renderWithProviders(<CopingList />)

    const group = await screen.findByRole('region', { name: 'Do' })

    const rows = within(group).getAllByRole('listitem')

    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent('First')
    expect(rows[1]).toHaveTextContent('Second')
    expect(rows[2]).toHaveTextContent('Third')
  })

  it('shows an item detail under its text, and nothing for an item without one', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing', 'In for 4, out for 6'))
    await addCopingItem(copingItem('do', 'Walk'))

    renderWithProviders(<CopingList />)

    const rows = within(await screen.findByRole('region', { name: 'Do' })).getAllByRole('listitem')

    const [withDetail, withoutDetail] = rows

    if (!withDetail || !withoutDetail) {
      throw new Error('Both items should be listed')
    }

    expect(within(withDetail).getByText('In for 4, out for 6')).toBeInTheDocument()
    expect(withoutDetail.querySelectorAll('p')).toHaveLength(1)
  })

  it('updates by itself when an item is added', async () => {
    renderWithProviders(<CopingList />)
    await screen.findByText('No items yet')

    await addCopingItem(copingItem('say', 'This will pass'))

    expect(await screen.findByText('This will pass')).toBeInTheDocument()
    expect(screen.queryByText('No items yet')).not.toBeInTheDocument()
  })

  it('leaves out a damaged item without breaking the list', async () => {
    await addCopingItem(copingItem('do', 'Walk'))
    await db.table('copingItems').add({ type: 'sing', text: 'broken' })

    renderWithProviders(<CopingList />)

    expect(await screen.findByText('Walk')).toBeInTheDocument()
    expect(screen.queryByText('broken')).not.toBeInTheDocument()
  })
})
