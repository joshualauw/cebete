import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { deleteCopingItem, listCopingItems } from '@/coping/repository'
import SettleScreen from '@/screens/SettleScreen'
import { renderWithProviders } from '@tests/helpers/render'

// These tests rely on the database being new: the first one looks at it before anything is
// changed, so it must stay first in this file.
describe('SettleScreen: on a brand-new database', () => {
  it('shows the three starter techniques as ordinary items, with their numbered steps', async () => {
    renderWithProviders(<SettleScreen />)

    const group = await screen.findByRole('region', { name: 'Do' })

    expect(
      within(group)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent),
    ).toEqual(['Slow breathing', 'Grounding: 5, 4, 3, 2, 1', 'Muscle relaxation'])
    expect(group).toHaveTextContent('1. Sit or stand somewhere comfortable')
    expect(group).toHaveTextContent('5. Notice how your body feels now.')
    expect(screen.queryByText(/add the things that help you/i)).not.toBeInTheDocument()
  })

  it('gives them the same card and green title as any item the user adds', async () => {
    renderWithProviders(<SettleScreen />)

    const titles = await screen.findAllByRole('heading', { level: 3 })
    const [first, ...rest] = titles

    for (const title of rest) {
      expect(title.className).toBe(first?.className)
      expect(title.closest('li')?.className).toBe(first?.closest('li')?.className)
    }
  })

  it('invites the user to add items once every starter has been deleted', async () => {
    renderWithProviders(<SettleScreen />)
    await screen.findByRole('region', { name: 'Do' })

    for (const item of await listCopingItems()) {
      await deleteCopingItem(item.id)
    }

    expect(await screen.findByText(/add the things that help you/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Do' })).not.toBeInTheDocument()
  })
})
