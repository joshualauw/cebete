import { fireEvent, screen, waitFor } from '@testing-library/react'
import { type ReactElement, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import ConfirmedRemove from '@/shared/ConfirmedRemove'
import { renderWithProviders } from '@tests/helpers/render'

type HarnessProps = {
  remove: () => Promise<void>
  /** Whether the control stays on screen after a removal, as it does until storage catches up. */
  staysAfterRemoval?: boolean
  buttonName?: string
}

function Harness({ remove, staysAfterRemoval = true, buttonName }: HarnessProps): ReactElement {
  const [asking, setAsking] = useState(false)
  const [removed, setRemoved] = useState(false)

  return (
    <>
      {removed && !staysAfterRemoval ? null : (
        <ConfirmedRemove
          buttonLabel="Remove it"
          buttonName={buttonName}
          groupLabel="Remove this"
          question="Remove this? This cannot be undone."
          confirmLabel="Yes, remove"
          progressLabel="Removing…"
          failedMessage="It could not be removed right now. Please try again."
          logMessage="Could not remove"
          remove={remove}
          asking={asking}
          locked={false}
          onAsk={() => {
            setAsking(true)
          }}
          onKeep={() => {
            setAsking(false)
          }}
          onRemoved={() => {
            setRemoved(true)
            setAsking(false)
          }}
        />
      )}
      <button type="button">Somewhere else</button>
    </>
  )
}

describe('ConfirmedRemove', () => {
  it('can give its button a fuller name than its label', () => {
    renderWithProviders(
      <Harness remove={vi.fn().mockResolvedValue(undefined)} buttonName="Remove the red one" />,
    )

    expect(screen.getByRole('button', { name: 'Remove the red one' })).toHaveTextContent(
      'Remove it',
    )
  })

  it('focuses Keep first, and gives focus back to its button on Keep', async () => {
    renderWithProviders(<Harness remove={vi.fn().mockResolvedValue(undefined)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove it' }))

    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove it' })).toHaveFocus()
    })
  })

  it('does not steal focus back to its own button after a successful removal', async () => {
    renderWithProviders(<Harness remove={vi.fn().mockResolvedValue(undefined)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove it' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove it' })).toBeInTheDocument()
    })
    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(screen.getByRole('button', { name: 'Remove it' })).not.toHaveFocus()
  })

  it('shows a calm message on failure, keeps the question, and still returns focus on Keep', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const remove = vi.fn().mockRejectedValueOnce(new Error('storage unavailable'))

    renderWithProviders(<Harness remove={remove} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove it' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be removed/i)

    fireEvent.click(screen.getByRole('button', { name: 'Keep' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove it' })).toHaveFocus()
    })
  })

  it('asks again with Keep focused after a removal that left it on screen', async () => {
    renderWithProviders(<Harness remove={vi.fn().mockResolvedValue(undefined)} />)
    fireEvent.click(screen.getByRole('button', { name: 'Remove it' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, remove' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove it' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Remove it' }))

    expect(screen.getByRole('button', { name: 'Keep' })).toHaveFocus()
  })
})
