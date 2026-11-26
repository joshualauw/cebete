import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { addCopingItem } from '@/coping/repository'
import { db } from '@/db/db'
import SettleScreen from '@/screens/SettleScreen'
import { copingItem } from '@tests/helpers/coping'
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

  it('needs no typing: it has no text fields and no forms', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing', '1. In for four'))

    renderWithProviders(<SettleScreen />)

    await screen.findByText('Slow breathing')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('invites the user to add items once it is known the library is empty', async () => {
    renderWithProviders(<SettleScreen />)

    expect(await screen.findByText(/add the things that help you/i)).toBeInTheDocument()
  })

  it('shows no group and no technique of its own when the library is empty', async () => {
    renderWithProviders(<SettleScreen />)

    await screen.findByText(/add the things that help you/i)

    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0)
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(screen.queryByText(/slow breathing/i)).not.toBeInTheDocument()
  })

  it('shows nothing of the library, and no prompt, until the items are read', () => {
    renderWithProviders(<SettleScreen />)

    expect(screen.queryByText(/add the things that help you/i)).not.toBeInTheDocument()
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })

  it('shows what is in the library, and nothing else, under Do', async () => {
    await addCopingItem(copingItem('do', 'Slow breathing', '1. In for four\n2. Out for six'))

    renderWithProviders(<SettleScreen />)

    expect(await screen.findByRole('heading', { level: 2, name: 'Do' })).toBeInTheDocument()
    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent),
    ).toEqual(['Slow breathing'])
    expect(screen.getByText(/1\. In for four/)).toBeInTheDocument()
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
