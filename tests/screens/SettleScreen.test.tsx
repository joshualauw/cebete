import { screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { STARTER_TECHNIQUES } from '@/coping/starters'
import { db } from '@/db/db'
import SettleScreen from '@/screens/SettleScreen'
import { renderWithProviders } from '@tests/helpers/render'

beforeEach(async () => {
  await db.copingItems.clear()
})

describe('SettleScreen', () => {
  it('has a calm heading and a way back to Home', () => {
    renderWithProviders(<SettleScreen />)

    expect(screen.getByRole('heading', { level: 1, name: 'Need to settle?' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', '/')
  })

  it('shows every built-in technique under Do, with its steps in order', () => {
    renderWithProviders(<SettleScreen />)

    expect(screen.getByRole('heading', { level: 2, name: 'Do' })).toBeInTheDocument()

    for (const technique of STARTER_TECHNIQUES) {
      const card = screen.getByRole('heading', { level: 3, name: technique.title }).closest('li')

      if (!card) {
        throw new Error(`No card for ${technique.title}`)
      }

      expect(
        within(card)
          .getAllByRole('listitem')
          .map((step) => step.textContent),
      ).toEqual([...technique.steps])
    }
  })

  it('needs no typing: it has no text fields and no forms', () => {
    renderWithProviders(<SettleScreen />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('invites the user to add personal items once it is known the library is empty', async () => {
    renderWithProviders(<SettleScreen />)

    expect(await screen.findByText(/add the things that help you/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Slow breathing' })).toBeInTheDocument()
  })

  it('shows the built-in techniques at once, without waiting for the items, and without the prompt', () => {
    renderWithProviders(<SettleScreen />)

    expect(screen.getByRole('heading', { level: 3, name: 'Slow breathing' })).toBeInTheDocument()
    expect(screen.queryByText(/add the things that help you/i)).not.toBeInTheDocument()
  })

  it('opens the coping library from "Edit my coping library"', () => {
    renderWithProviders(<SettleScreen />)

    expect(screen.getByRole('link', { name: 'Edit my coping library' })).toHaveAttribute(
      'href',
      '/coping',
    )
  })

  it('says calmly that cebete is a self-help tool, not emergency help', () => {
    renderWithProviders(<SettleScreen />)

    expect(
      screen.getByText(/self-help tool.*not a substitute for professional care or emergency help/i),
    ).toBeInTheDocument()
  })
})
