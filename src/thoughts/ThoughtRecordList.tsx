import { Box, Heading, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'

import ChallengeFlow from './ChallengeFlow'
import ChallengeView from './ChallengeView'
import ThoughtRecordFlow from './ThoughtRecordFlow'
import ThoughtRecordItem from './ThoughtRecordItem'
import { useThoughtRecords } from './useThoughtRecords'

type ThoughtRecordListProps = {
  /** Switches every Edit and Challenge action off, for example while the capture flow is open. */
  locked?: boolean
  /** Told whenever a record's edit or challenge flow opens or closes. */
  onEditingChange?: (editing: boolean) => void
}

type Flow = { readonly kind: 'edit' | 'challenge' | 'view'; readonly id: number }

function recordsLeft(count: number): string {
  if (count === 0) {
    return 'No records left.'
  }

  return count === 1 ? '1 record left.' : `${String(count)} records left.`
}

/** All thought records, newest first, with a friendly message when there are none. */
export default function ThoughtRecordList({
  locked = false,
  onEditingChange,
}: ThoughtRecordListProps): ReactElement | null {
  const state = useThoughtRecords()
  const [announcement, setAnnouncement] = useState('')
  const [flow, setFlow] = useState<Flow | null>(null)
  const [returned, setReturned] = useState<Flow | null>(null)
  const [notice, setNotice] = useState('')
  const regionRef = useRef<HTMLElement>(null)

  const records = state.status === 'ready' ? state.records : []
  const active = flow !== null && records.some((record) => record.id === flow.id) ? flow : null
  const editing = active !== null

  if (state.status === 'ready' && flow !== null && active === null) {
    setFlow(null)
    setNotice('The record you were working on was deleted, so nothing was saved.')
  }

  useEffect(() => {
    onEditingChange?.(editing)
  }, [editing, onEditingChange])

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

  function handleDeleted(): void {
    setAnnouncement(`Record deleted. ${recordsLeft(Math.max(records.length - 1, 0))}`)
    regionRef.current?.focus()
  }

  function closeFlow(closed: Flow): void {
    setFlow(null)
    setReturned(closed)
  }

  function open(next: Flow): void {
    setNotice('')
    setAnnouncement('')
    setReturned(null)
    setFlow(next)
  }

  return (
    <Box as="section" ref={regionRef} aria-label="Thought records" tabIndex={-1} outline="none">
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      {notice ? (
        <Box role="status" bg="bg.muted" borderRadius="lg" p="3" mb="3">
          {notice}
        </Box>
      ) : null}
      {records.length === 0 ? (
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
          {records.map((record) =>
            record.id === active?.id ? (
              <Box as="li" key={record.id}>
                {active.kind === 'view' && record.challenge ? (
                  <ChallengeView
                    record={record}
                    challenge={record.challenge}
                    onClose={() => {
                      closeFlow(active)
                    }}
                    onRevise={() => {
                      setFlow({ kind: 'challenge', id: record.id })
                    }}
                  />
                ) : active.kind === 'challenge' ? (
                  <ChallengeFlow
                    record={record}
                    onSaved={() => {
                      setAnnouncement('Challenge saved.')
                    }}
                    onDone={() => {
                      closeFlow(active)
                    }}
                  />
                ) : (
                  <ThoughtRecordFlow
                    record={record}
                    onSaved={() => {
                      setAnnouncement('Record updated.')
                    }}
                    onDone={() => {
                      closeFlow(active)
                    }}
                  />
                )}
              </Box>
            ) : (
              <ThoughtRecordItem
                key={record.id}
                record={record}
                onDeleted={handleDeleted}
                onEdit={() => {
                  open({ kind: 'edit', id: record.id })
                }}
                onChallenge={() => {
                  open({ kind: 'challenge', id: record.id })
                }}
                onView={() => {
                  open({ kind: 'view', id: record.id })
                }}
                editDisabled={locked || editing}
                focusEdit={returned?.kind === 'edit' && returned.id === record.id}
                focusPrimary={
                  (returned?.kind === 'challenge' || returned?.kind === 'view') &&
                  returned.id === record.id
                }
              />
            ),
          )}
        </Box>
      )}
    </Box>
  )
}
