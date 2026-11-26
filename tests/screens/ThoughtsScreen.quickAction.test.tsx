import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { InitialEntry } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { db } from '@/db/db'
import { openFormRequest } from '@/navigation/openForm'
import ThoughtsScreen from '@/screens/ThoughtsScreen'
import { addThoughtRecord } from '@/thoughts/repository'
import { afterDelete, backFromRecord } from '@/thoughts/listState'
import { LocationProbe } from '@tests/helpers/locationProbe'
import { renderWithProviders } from '@tests/helpers/render'
import { newThought } from '@tests/helpers/thoughts'

const REQUESTED: InitialEntry = { pathname: '/thoughts', state: openFormRequest }

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

function renderThoughts(route: InitialEntry = '/thoughts'): void {
  renderWithProviders(
    <>
      <ThoughtsScreen />
      <LocationProbe />
    </>,
    route,
  )
}

function capture(): HTMLElement {
  return screen.getByRole('region', { name: 'New thought record' })
}

describe('ThoughtsScreen: opened by a quick action', () => {
  it('starts with the guided capture open on its first step, and focus in it', () => {
    renderThoughts(REQUESTED)

    expect(within(capture()).getByText(/Step 1 of 6/)).toBeInTheDocument()
    expect(within(capture()).getByRole('heading', { level: 2 })).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'New thought record' })).not.toBeInTheDocument()
  })

  it('shows the list below the capture', async () => {
    await addThoughtRecord(newThought({ thought: 'I will fail the exam' }))

    renderThoughts(REQUESTED)

    expect(capture()).toBeInTheDocument()
    expect(await screen.findByText('I will fail the exam')).toBeInTheDocument()
  })

  it('has the capture ready even while the list is still loading', () => {
    renderThoughts(REQUESTED)

    expect(capture()).toBeInTheDocument()
    expect(screen.queryByText(/no thought records yet/i)).not.toBeInTheDocument()
  })

  it('uses the request once: the history note is cleared, and the address stays', async () => {
    renderThoughts(REQUESTED)

    await waitFor(() => {
      expect(screen.getByTestId('history-note')).toHaveTextContent('null')
    })
    expect(screen.getByTestId('pathname')).toHaveTextContent('/thoughts')
    expect(capture()).toBeInTheDocument()
  })

  it('closes on Cancel, leaves the user on Thoughts, and gives focus back to the New button', async () => {
    await addThoughtRecord(newThought({ thought: 'I will fail the exam' }))
    renderThoughts(REQUESTED)

    fireEvent.click(within(capture()).getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('region', { name: 'New thought record' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New thought record' })).toHaveFocus()
    expect(screen.getByTestId('pathname')).toHaveTextContent('/thoughts')
    expect(await screen.findByText('I will fail the exam')).toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(1)
  })
})

describe('ThoughtsScreen: opened in the ordinary ways', () => {
  it('shows no capture when opened by its address', async () => {
    renderThoughts('/thoughts')

    expect(screen.getByRole('button', { name: 'New thought record' })).toBeEnabled()
    expect(screen.queryByRole('region', { name: 'New thought record' })).not.toBeInTheDocument()
    await screen.findByText(/no thought records yet/i)
  })

  it('shows no capture for a history note that does not ask for one', () => {
    renderThoughts({ pathname: '/thoughts', state: { somethingElse: true } })

    expect(screen.queryByRole('region', { name: 'New thought record' })).not.toBeInTheDocument()
  })
})

describe('ThoughtsScreen: the notes the list keeps in the same history entry', () => {
  it('still tells the user about a delete, with no capture opened', async () => {
    await addThoughtRecord(newThought({ thought: 'The one that stays' }))

    renderThoughts({ pathname: '/thoughts', state: afterDelete })

    expect(await screen.findByText('Record deleted. 1 record left.')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'New thought record' })).not.toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByTestId('history-note')).toHaveTextContent('null')
    })
  })

  it('still returns focus to the card the user came back from, with no capture opened', async () => {
    const record = await addThoughtRecord(newThought({ thought: 'The one I opened' }))

    renderThoughts({ pathname: '/thoughts', state: backFromRecord(record.id) })

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /The one I opened/ })).toHaveFocus()
    })
    expect(screen.queryByRole('region', { name: 'New thought record' })).not.toBeInTheDocument()
  })

  it('does not announce a delete just because the capture was asked for', async () => {
    await addThoughtRecord(newThought({ thought: 'A record' }))

    renderThoughts(REQUESTED)

    await screen.findByText('A record')

    expect(screen.queryByText(/record deleted/i)).not.toBeInTheDocument()
  })
})
