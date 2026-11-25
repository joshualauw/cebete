import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addThoughtRecord, saveThoughtBody } from '@/thoughts/repository'
import { openRecordScreen } from '@tests/helpers/recordScreen'
import { newThought } from '@tests/helpers/thoughts'

let id = 0

beforeEach(async () => {
  await db.thoughtRecords.clear()
  id = (
    await addThoughtRecord({
      ...newThought({ thought: 'My heart will not stop racing' }),
      createdAt: new Date(2020, 0, 1, 9, 0).getTime(),
    })
  ).id
})

afterEach(() => {
  vi.restoreAllMocks()
})

function bodyPart(): HTMLElement {
  return screen.getByRole('region', { name: 'Body' })
}

function formRegion(): HTMLElement {
  return screen.getByRole('region', { name: 'Note body reactions' })
}

function heading(): HTMLElement {
  return within(formRegion()).getByRole('heading', { level: 2 })
}

function area(name: string): HTMLElement {
  return screen.getByRole('checkbox', { name })
}

function descriptionField(name: string): HTMLElement {
  return screen.getByLabelText(`${name}: what does it feel like?`)
}

function describe_(name: string, text: string): void {
  fireEvent.change(descriptionField(name), { target: { value: text } })
}

function save(): void {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
}

async function openForm(): Promise<void> {
  await openRecordScreen(id)
  fireEvent.click(within(bodyPart()).getByRole('button', { name: 'Note body reactions' }))
}

async function formClosed(): Promise<void> {
  await waitFor(() => {
    expect(screen.queryByRole('region', { name: 'Note body reactions' })).not.toBeInTheDocument()
  })
}

describe('the Body section: before any notes', () => {
  it('invites the user to note body reactions, and offers nothing else', async () => {
    await openRecordScreen(id)

    const part = within(bodyPart())

    expect(part.getByText(/felt in the body/i)).toBeInTheDocument()
    expect(part.getByRole('button', { name: 'Note body reactions' })).toBeEnabled()
    expect(part.queryByRole('button', { name: 'Edit body reactions' })).not.toBeInTheDocument()
  })

  it('sits below the Test part and above Delete', async () => {
    await openRecordScreen(id)

    const test = screen.getByRole('region', { name: 'Test' })
    const remove = screen.getByRole('button', { name: 'Delete this record' })

    expect(bodyPart().compareDocumentPosition(test) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
    expect(
      bodyPart().compareDocumentPosition(remove) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})

describe('the body form', () => {
  it('opens in place of the Body section, on one screen, with its heading focused', async () => {
    await openForm()

    expect(heading()).toHaveTextContent('Body reactions')
    expect(heading()).toHaveFocus()
    expect(screen.queryByRole('region', { name: 'Body' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'The thought' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Test' })).toBeInTheDocument()
  })

  it('offers the seven areas in a fixed order, none chosen, as real checkboxes in a named group', async () => {
    await openForm()

    const group = screen.getByRole('group', { name: 'Where do you feel it?' })
    const boxes = within(group).getAllByRole('checkbox')

    expect(boxes.map((box) => box.getAttribute('value'))).toEqual([
      'head',
      'throat-neck',
      'chest',
      'stomach',
      'hands',
      'legs',
      'whole-body',
    ])
    for (const box of boxes) {
      expect(box).toHaveAttribute('type', 'checkbox')
      expect(box).not.toBeChecked()
      expect(box).toBeEnabled()
      expect(box).not.toHaveAttribute('tabindex', '-1')
    }
    for (const name of [
      'Head',
      'Throat and neck',
      'Chest',
      'Stomach',
      'Hands',
      'Legs',
      'Whole body',
    ]) {
      expect(area(name)).toBeInTheDocument()
    }
  })

  it('shows a description field only for a chosen area, and takes it away again', async () => {
    await openForm()

    expect(screen.queryByLabelText(/what does it feel like/i)).not.toBeInTheDocument()

    fireEvent.click(area('Chest'))

    expect(descriptionField('Chest')).toHaveValue('')
    expect(descriptionField('Chest')).toHaveAttribute('maxlength', '500')

    describe_('Chest', 'tight')
    fireEvent.click(area('Chest'))

    expect(screen.queryByLabelText(/what does it feel like/i)).not.toBeInTheDocument()

    fireEvent.click(area('Chest'))

    expect(descriptionField('Chest')).toHaveValue('')
  })

  it('keeps Save off until something has changed, and off again when the change is undone', async () => {
    await openForm()

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()

    fireEvent.click(area('Head'))

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()

    fireEvent.click(area('Head'))

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
  })
})

describe('saving body notes', () => {
  it('lists the areas with their descriptions, in the order of the areas', async () => {
    await openForm()
    fireEvent.click(area('Legs'))
    fireEvent.click(area('Stomach'))
    fireEvent.click(area('Chest'))
    describe_('Legs', 'heavy')
    describe_('Chest', '  tight  ')
    save()
    await formClosed()

    const items = within(bodyPart()).getAllByRole('listitem')

    expect(items.map((item) => item.textContent)).toEqual(['Chesttight', 'Stomach', 'Legsheavy'])
    expect(within(bodyPart()).queryByText(/felt in the body/i)).not.toBeInTheDocument()
    expect(within(bodyPart()).getByRole('button', { name: 'Edit body reactions' })).toBeEnabled()
    expect(
      within(bodyPart()).queryByRole('button', { name: 'Note body reactions' }),
    ).not.toBeInTheDocument()
  })

  it('stores the notes on the same record, in order, with blank descriptions left out', async () => {
    const before = await db.thoughtRecords.get(id)

    await openForm()
    fireEvent.click(area('Legs'))
    fireEvent.click(area('Head'))
    describe_('Legs', '   ')
    describe_('Head', 'pounding')
    save()
    await formClosed()

    expect(await db.thoughtRecords.get(id)).toEqual({
      ...before,
      body: [{ area: 'head', description: 'pounding' }, { area: 'legs' }],
    })
    expect(await db.thoughtRecords.count()).toBe(1)
  })

  it('announces it politely, and keeps focus on the button, where it stays', async () => {
    await openForm()
    fireEvent.click(area('Chest'))
    save()
    await formClosed()

    expect(await screen.findByText('Body notes saved.')).toBeInTheDocument()
    await waitFor(() => {
      expect(within(bodyPart()).getByRole('button', { name: 'Edit body reactions' })).toHaveFocus()
    })
    await new Promise((resolve) => setTimeout(resolve, 150))

    expect(within(bodyPart()).getByRole('button', { name: 'Edit body reactions' })).toHaveFocus()
  })

  it('saves once when Save is tapped twice', async () => {
    const put = vi.spyOn(db.thoughtRecords, 'put')

    await openForm()
    fireEvent.click(area('Chest'))

    const button = screen.getByRole('button', { name: 'Save' })

    fireEvent.click(button)
    fireEvent.click(button)
    await formClosed()

    expect(put).toHaveBeenCalledTimes(1)
  })

  it('shows a calm message and keeps everything typed when saving fails, and a retry works', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const before = await db.thoughtRecords.get(id)

    vi.spyOn(db.thoughtRecords, 'put').mockRejectedValueOnce(new Error('storage unavailable'))
    await openForm()
    fireEvent.click(area('Chest'))
    describe_('Chest', 'kept text')
    save()

    expect(await screen.findByRole('alert')).toHaveTextContent(/could not be saved/i)
    expect(descriptionField('Chest')).toHaveValue('kept text')
    expect(area('Chest')).toBeChecked()
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    expect(report).toHaveBeenCalled()
    expect(await db.thoughtRecords.get(id)).toEqual(before)

    save()
    await formClosed()

    expect((await db.thoughtRecords.get(id))?.body).toEqual([
      { area: 'chest', description: 'kept text' },
    ])
  })
})

describe('editing body notes', () => {
  beforeEach(async () => {
    await saveThoughtBody(id, [{ area: 'chest', description: 'tight' }, { area: 'stomach' }])
  })

  async function openEdit(): Promise<void> {
    await openRecordScreen(id)
    fireEvent.click(within(bodyPart()).getByRole('button', { name: 'Edit body reactions' }))
  }

  it('opens the form filled with the saved areas and descriptions', async () => {
    await openEdit()

    expect(area('Chest')).toBeChecked()
    expect(area('Stomach')).toBeChecked()
    expect(area('Head')).not.toBeChecked()
    expect(descriptionField('Chest')).toHaveValue('tight')
    expect(descriptionField('Stomach')).toHaveValue('')
  })

  it('adds, changes and removes areas, and the section shows the result', async () => {
    await openEdit()
    fireEvent.click(area('Head'))
    describe_('Head', 'pounding')
    describe_('Chest', 'racing')
    fireEvent.click(area('Stomach'))
    save()
    await formClosed()

    expect(
      within(bodyPart())
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Headpounding', 'Chestracing'])
    expect((await db.thoughtRecords.get(id))?.body).toEqual([
      { area: 'head', description: 'pounding' },
      { area: 'chest', description: 'racing' },
    ])
  })

  it('returns the section to its prompt, and removes the property, when every area is cleared', async () => {
    await openEdit()
    fireEvent.click(area('Chest'))
    fireEvent.click(area('Stomach'))

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()

    save()
    await formClosed()

    expect(within(bodyPart()).getByText(/felt in the body/i)).toBeInTheDocument()
    expect(within(bodyPart()).getByRole('button', { name: 'Note body reactions' })).toBeEnabled()
    expect(await db.thoughtRecords.get(id)).not.toHaveProperty('body')
  })

  it('keeps the old notes when the edit is cancelled', async () => {
    const before = await db.thoughtRecords.get(id)

    await openEdit()
    describe_('Chest', 'never saved')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await formClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    expect(within(bodyPart()).getByText('tight')).toBeInTheDocument()
  })
})

describe('closing the body form', () => {
  it('closes at once when nothing was changed, and returns focus to the button', async () => {
    const before = await db.thoughtRecords.get(id)

    await openForm()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await formClosed()

    expect(screen.queryByText('Discard these notes?')).not.toBeInTheDocument()
    expect(await db.thoughtRecords.get(id)).toEqual(before)
    await waitFor(() => {
      expect(within(bodyPart()).getByRole('button', { name: 'Note body reactions' })).toHaveFocus()
    })
  })

  it('asks before discarding a change, with Keep editing focused, and keeps what was typed', async () => {
    await openForm()
    fireEvent.click(area('Chest'))
    describe_('Chest', 'typed')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(heading()).toHaveTextContent('Discard these notes?')
    expect(screen.getByRole('button', { name: 'Keep editing' })).toHaveFocus()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }))

    expect(area('Chest')).toBeChecked()
    expect(descriptionField('Chest')).toHaveValue('typed')
  })

  it('leaves the record unchanged when the change is discarded', async () => {
    const before = await db.thoughtRecords.get(id)

    await openForm()
    fireEvent.click(area('Head'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, discard' }))
    await formClosed()

    expect(await db.thoughtRecords.get(id)).toEqual(before)
    expect(screen.queryByText('Body notes saved.')).not.toBeInTheDocument()
  })

  it('does not ask when the change has been undone', async () => {
    await openForm()
    fireEvent.click(area('Head'))
    fireEvent.click(area('Head'))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await formClosed()

    expect(screen.queryByText('Discard these notes?')).not.toBeInTheDocument()
  })
})

describe('one flow at a time with the body form', () => {
  it('switches Edit, Challenge, the plan and Delete off while the form is open, and back on after', async () => {
    await openForm()

    expect(
      within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
        name: 'Edit',
      }),
    ).toBeDisabled()
    expect(
      within(screen.getByRole('region', { name: 'Challenge' })).getByRole('button', {
        name: 'Challenge this thought',
      }),
    ).toBeDisabled()
    expect(
      within(screen.getByRole('region', { name: 'Test' })).getByRole('button', {
        name: 'Plan a test',
      }),
    ).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Delete this record' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await formClosed()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Delete this record' })).toBeEnabled()
    })
  })

  it('switches Note body reactions off while the record is being edited', async () => {
    await openRecordScreen(id)
    fireEvent.click(
      within(screen.getByRole('region', { name: 'The thought' })).getByRole('button', {
        name: 'Edit',
      }),
    )

    expect(within(bodyPart()).getByRole('button', { name: 'Note body reactions' })).toBeDisabled()
  })

  it('switches Note body reactions off while the delete question is open', async () => {
    await openRecordScreen(id)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this record' }))

    expect(within(bodyPart()).getByRole('button', { name: 'Note body reactions' })).toBeDisabled()
  })
})

describe('a record deleted', () => {
  it('while the form is open: says so calmly, closes the form and recreates nothing', async () => {
    await openForm()
    fireEvent.click(area('Chest'))
    await db.thoughtRecords.delete(id)

    expect(await screen.findByText(/could not be found/i)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Note body reactions' })).not.toBeInTheDocument()
    expect(await db.thoughtRecords.count()).toBe(0)
  })

  it('from its screen takes its notes with it', async () => {
    await saveThoughtBody(id, [{ area: 'chest' }])
    await openRecordScreen(id)
    fireEvent.click(screen.getByRole('button', { name: 'Delete this record' }))
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('Record deleted. No records left.')).toBeInTheDocument()
    expect(await db.thoughtRecords.toArray()).toEqual([])
  })
})
