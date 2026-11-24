import { Box, Heading, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'

import MoodEntryItem from './MoodEntryItem'
import MoodForm from './MoodForm'
import { useMoodEntries } from './useMoodEntries'

type MoodListProps = {
  /** Switches every Edit action off, for example while the add form is open. */
  locked?: boolean
  /** Told whenever an entry's edit form opens or closes. */
  onEditingChange?: (editing: boolean) => void
}

function entriesLeft(count: number): string {
  if (count === 0) {
    return 'No entries left.'
  }

  return count === 1 ? '1 entry left.' : `${String(count)} entries left.`
}

/**
 * All mood entries, newest first, with a friendly message when there are none. An entry can be
 * edited in place, one at a time.
 */
export default function MoodList({
  locked = false,
  onEditingChange,
}: MoodListProps): ReactElement | null {
  const state = useMoodEntries()
  const [announcement, setAnnouncement] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [returnedId, setReturnedId] = useState<number | null>(null)
  const regionRef = useRef<HTMLElement>(null)

  const entries = state.status === 'ready' ? state.entries : []
  // An entry that vanishes while its form is open leaves nothing to edit.
  const activeId = entries.some((entry) => entry.id === editingId) ? editingId : null
  const editing = activeId !== null

  useEffect(() => {
    onEditingChange?.(editing)
  }, [editing, onEditingChange])

  // Show nothing while the first read is under way, so the empty state never flashes by mistake.
  if (state.status === 'loading') {
    return null
  }

  if (state.status === 'error') {
    return (
      <Box role="status" bg="bg.error" color="fg.error" borderRadius="xl" p="4">
        Your entries could not be loaded right now. Please close the app and open it again.
      </Box>
    )
  }

  function handleDeleted(): void {
    setAnnouncement(`Entry deleted. ${entriesLeft(Math.max(entries.length - 1, 0))}`)
    // The deleted entry is about to disappear, so keep the user's place in the list.
    regionRef.current?.focus()
  }

  function closeForm(id: number): void {
    setEditingId(null)
    setReturnedId(id)
  }

  return (
    <Box as="section" ref={regionRef} aria-label="Mood entries" tabIndex={-1} outline="none">
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      {entries.length === 0 ? (
        <Box textAlign="center" py="10">
          <Heading as="h2" size="lg" color="colorPalette.fg">
            No entries yet
          </Heading>
          <Text mt="2" color="fg.muted">
            Add your first entry to start noticing how you feel over time.
          </Text>
        </Box>
      ) : (
        <Box as="ul" display="flex" flexDirection="column" gap="3" listStyleType="none" m="0" p="0">
          {entries.map((entry) =>
            entry.id === activeId ? (
              <Box as="li" key={entry.id}>
                <MoodForm
                  entry={entry}
                  onSaved={() => {
                    setAnnouncement('Entry updated.')
                  }}
                  onDone={() => {
                    closeForm(entry.id)
                  }}
                />
              </Box>
            ) : (
              <MoodEntryItem
                key={entry.id}
                entry={entry}
                onDeleted={handleDeleted}
                onEdit={() => {
                  setAnnouncement('')
                  setReturnedId(null)
                  setEditingId(entry.id)
                }}
                editDisabled={locked || editing}
                focusEdit={entry.id === returnedId}
              />
            ),
          )}
        </Box>
      )}
    </Box>
  )
}
