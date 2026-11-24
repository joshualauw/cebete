import { Box, Heading, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useRef, useState } from 'react'

import MoodEntryItem from './MoodEntryItem'
import { useMoodEntries } from './useMoodEntries'

function entriesLeft(count: number): string {
  if (count === 0) {
    return 'No entries left.'
  }

  return count === 1 ? '1 entry left.' : `${String(count)} entries left.`
}

/** All mood entries, newest first, with a friendly message when there are none. */
export default function MoodList(): ReactElement | null {
  const state = useMoodEntries()
  const [announcement, setAnnouncement] = useState('')
  const regionRef = useRef<HTMLElement>(null)

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

  const { entries } = state

  function handleDeleted(): void {
    setAnnouncement(`Entry deleted. ${entriesLeft(Math.max(entries.length - 1, 0))}`)
    // The deleted entry is about to disappear, so keep the user's place in the list.
    regionRef.current?.focus()
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
          {entries.map((entry) => (
            <MoodEntryItem key={entry.id} entry={entry} onDeleted={handleDeleted} />
          ))}
        </Box>
      )}
    </Box>
  )
}
