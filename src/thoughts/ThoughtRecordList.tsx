import { Box, Heading, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'

import { backFromRecord, isAfterDelete, recordLeftFrom } from './listState'
import ThoughtRecordItem from './ThoughtRecordItem'
import { useThoughtRecords } from './useThoughtRecords'

type ThoughtRecordListProps = {
  /** Makes every card inert, for example while the capture flow is open. */
  locked?: boolean
}

function recordsLeft(count: number): string {
  if (count === 0) {
    return 'No records left.'
  }

  return count === 1 ? '1 record left.' : `${String(count)} records left.`
}

/** All thought records, newest first, with a friendly message when there are none. */
export default function ThoughtRecordList({
  locked = false,
}: ThoughtRecordListProps): ReactElement | null {
  const state = useThoughtRecords()
  const location = useLocation()
  const navigate = useNavigate()
  const [announcement, setAnnouncement] = useState('')
  const [told, setTold] = useState(false)
  // Read once, when the list appears: later changes to the history entry must not move focus.
  const [cameFrom] = useState(() => recordLeftFrom(location.state))
  const regionRef = useRef<HTMLElement>(null)

  // The record screen sends the user here after a delete. Tell them once the list is read, so
  // that the number of records left is known.
  if (!told && state.status === 'ready' && isAfterDelete(location.state)) {
    setTold(true)
    setAnnouncement(`Record deleted. ${recordsLeft(state.records.length)}`)
  }

  // Once the user has been told, or focus has been decided, clear the note so that a reload or
  // a later visit does not repeat it.
  useEffect(() => {
    if (told) {
      regionRef.current?.focus()
    }
    if (told || cameFrom !== null) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [told, cameFrom, navigate, location.pathname])

  if (state.status === 'loading') {
    return null
  }

  if (state.status === 'error') {
    return (
      <Box role="status" bg="bg.error" color="fg.error" borderRadius="xl" p="4">
        Your thought records could not be loaded right now. Please close the app and open it again.
      </Box>
    )
  }

  return (
    <Box as="section" ref={regionRef} aria-label="Thought records" tabIndex={-1} outline="none">
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      {state.records.length === 0 ? (
        <Box textAlign="center" py="10">
          <Heading as="h2" size="lg" color="colorPalette.fg">
            No thought records yet
          </Heading>
          <Text mt="2" color="fg.muted">
            When a thought is weighing on you, write it down here to look at it more clearly.
          </Text>
        </Box>
      ) : (
        <Box as="ul" display="flex" flexDirection="column" gap="3" listStyleType="none" m="0" p="0">
          {state.records.map((record) => (
            <ThoughtRecordItem
              key={record.id}
              record={record}
              locked={locked}
              focus={record.id === cameFrom}
              onOpen={() => {
                // The list entry remembers which record was opened, so the browser's back button
                // returns focus to its card too.
                void navigate(location.pathname, {
                  replace: true,
                  state: backFromRecord(record.id),
                })
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  )
}
