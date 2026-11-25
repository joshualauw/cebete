import { fireEvent, screen } from '@testing-library/react'
import { type ReactElement, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import StepFlow, { type FlowStep } from '@/thoughts/StepFlow'
import { renderWithProviders } from '@tests/helpers/render'

type ExampleProps = {
  onSave?: () => void
  onClose?: () => void
  gone?: boolean
  saving?: boolean
  errorMessage?: string | null
  reachedAtStart?: number
  startText?: string
  startName?: string
}

/** A small flow made of three steps: an optional note, a required name, and a last step. */
function Example({
  onSave = () => undefined,
  onClose = () => undefined,
  gone = false,
  saving = false,
  errorMessage = null,
  reachedAtStart = 0,
  startText = '',
  startName = '',
}: ExampleProps): ReactElement {
  const [note, setNote] = useState(startText)
  const [name, setName] = useState(startName)

  const steps: readonly FlowStep[] = [
    {
      title: 'The note',
      optional: true,
      empty: note.trim() === '',
      content: (
        <input
          aria-label="Note"
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
          }}
        />
      ),
    },
    {
      title: 'The name',
      needs: name.trim() === '' ? 'Write a name to continue.' : null,
      content: (
        <input
          aria-label="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
          }}
        />
      ),
    },
    { title: 'The end', content: <p>All done</p> },
  ]

  return (
    <StepFlow
      label="Example flow"
      eyebrow="Example"
      discardTitle="Discard the example?"
      steps={steps}
      aboveStep={<p>Reminder above every step</p>}
      reachedAtStart={reachedAtStart}
      changed={note !== startText || name !== startName}
      saving={saving}
      gone={gone}
      errorMessage={errorMessage}
      onSave={onSave}
      onClose={onClose}
    />
  )
}

function marker(number: number): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(`^Step ${String(number)}:`) })
}

function heading(): HTMLElement {
  return screen.getByRole('heading', { level: 2 })
}

describe('StepFlow', () => {
  it('starts on the first step with its step line, name and markers', () => {
    renderWithProviders(<Example />)

    expect(screen.getByRole('region', { name: 'Example flow' })).toBeInTheDocument()
    expect(screen.getByText('Example · Step 1 of 3')).toBeInTheDocument()
    expect(heading()).toHaveTextContent('The note')
    expect(heading()).toHaveFocus()
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    expect(marker(1)).toHaveAttribute('aria-current', 'step')
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
  })

  it('shows Skip while an optional step is empty and Next once it has text', () => {
    renderWithProviders(<Example />)

    expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled()

    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'hello' } })

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
  })

  it('blocks Next on a required step until it is filled, and says why', () => {
    renderWithProviders(<Example />)
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))

    expect(heading()).toHaveTextContent('The name')
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next' })).toHaveAccessibleDescription(
      'Write a name to continue.',
    )

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sam' } })

    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('applies the forward rule to the markers, and lifts it once the required step is filled', () => {
    renderWithProviders(<Example />)

    expect(marker(2)).not.toHaveAttribute('aria-disabled')
    expect(marker(3)).toHaveAttribute('aria-disabled', 'true')
    expect(marker(3)).toHaveAccessibleDescription('Write a name to continue.')

    fireEvent.click(marker(2))
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Sam' } })

    expect(marker(3)).not.toHaveAttribute('aria-disabled')

    fireEvent.click(marker(3))

    expect(heading()).toHaveTextContent('The end')
    expect(heading()).toHaveFocus()
  })

  it('goes back with Back and keeps what was typed', () => {
    renderWithProviders(<Example />)
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'kept' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByLabelText('Note')).toHaveValue('kept')
  })

  it('has Save on the last step, and calls it', () => {
    const onSave = vi.fn()

    renderWithProviders(<Example onSave={onSave} reachedAtStart={2} startName="Sam" />)
    fireEvent.click(marker(3))
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('makes every step reachable when it opens with all steps reached, and shows them as finished', () => {
    renderWithProviders(<Example reachedAtStart={2} startName="Sam" />)

    expect(marker(3)).not.toHaveAttribute('aria-disabled')
    expect(marker(3)).toHaveAttribute('data-finished')
  })

  it('shows Saving… and switches the buttons off while saving', () => {
    renderWithProviders(<Example saving reachedAtStart={2} startName="Sam" />)
    fireEvent.click(marker(3))

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
  })

  it('shows a failure message and keeps the flow open', () => {
    renderWithProviders(<Example errorMessage="It could not be saved." />)

    expect(screen.getByRole('alert')).toHaveTextContent('It could not be saved.')
    expect(heading()).toHaveTextContent('The note')
  })
})

describe('StepFlow: closing', () => {
  it('closes at once when nothing was changed', () => {
    const onClose = vi.fn()

    renderWithProviders(<Example onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onClose).toHaveBeenCalledOnce()
  })

  it('asks before discarding a change, with the markers hidden and the safe choice focused', () => {
    const onClose = vi.fn()

    renderWithProviders(<Example onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'typed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard the example?')
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()
    expect(screen.queryByRole('list', { name: 'Steps' })).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('goes back to the same step with everything kept after Keep editing', () => {
    renderWithProviders(<Example />)
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'typed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(heading()).toHaveTextContent('The name')
    expect(heading()).toHaveFocus()
    expect(screen.getByRole('list', { name: 'Steps' })).toBeInTheDocument()

    fireEvent.click(marker(1))

    expect(screen.getByLabelText('Note')).toHaveValue('typed')
  })

  it('closes after the user confirms the discard', () => {
    const onClose = vi.fn()

    renderWithProviders(<Example onClose={onClose} />)
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'typed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('StepFlow: when the thing being changed is gone', () => {
  it('shows the message, hides the markers, Cancel and Save, and offers only Close', () => {
    const onClose = vi.fn()

    renderWithProviders(
      <Example gone errorMessage="It no longer exists." onClose={onClose} reachedAtStart={2} />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('It no longer exists.')
    expect(screen.queryByRole('list', { name: 'Steps' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cancel' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()

    fireEvent.click(screen.getByRole('button', { name: 'Close' }))

    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('StepFlow: the block above the steps', () => {
  it('shows on every step, and stays in place when moving between steps', () => {
    renderWithProviders(<Example reachedAtStart={2} startName="Sam" />)

    const reminder = screen.getByText('Reminder above every step')

    expect(reminder).toBeInTheDocument()

    fireEvent.click(marker(2))
    fireEvent.click(marker(3))

    expect(screen.getByText('Reminder above every step')).toBe(reminder)
  })

  it('is hidden during the discard question, and back after Keep editing', () => {
    renderWithProviders(<Example />)
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'typed' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Reminder above every step')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(screen.getByText('Reminder above every step')).toBeInTheDocument()
  })

  it('is hidden when the thing being changed is gone', () => {
    renderWithProviders(<Example gone errorMessage="It no longer exists." />)

    expect(screen.queryByText('Reminder above every step')).not.toBeInTheDocument()
  })
})
