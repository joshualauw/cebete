import { Box, Button, chakra, Flex, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuPencil, LuTrash2 } from 'react-icons/lu'

import { emotionLabel } from '@/mood/emotions'
import { formatEntryTime } from '@/mood/format'
import { INTENSITY_MAX } from '@/mood/types'

import { deleteThoughtRecord } from './repository'
import { BELIEF_MAX, type ThoughtRecord } from './types'

type ThoughtRecordItemProps = {
  record: ThoughtRecord
  onDeleted: () => void
  onEdit?: () => void
  /** Opens the challenge. Without it the card offers no challenge. */
  onChallenge?: () => void
  /** Opens the challenge for reading. Without it a challenged card offers no way to open it. */
  onView?: () => void
  /** Switches the Edit and Challenge actions off, for example while a flow is open. */
  editDisabled?: boolean
  /** Moves focus to the Edit action when the card appears, after its form was closed. */
  focusEdit?: boolean
  /** Moves focus to the main action of the card, after a challenge flow was closed. */
  focusPrimary?: boolean
}

const DELETE_FAILED = 'This record could not be deleted right now. Please try again.'
const NAME_LENGTH = 40

function nameOf(record: ThoughtRecord): string {
  const thought =
    record.thought.length > NAME_LENGTH
      ? `${record.thought.slice(0, NAME_LENGTH).trimEnd()}…`
      : record.thought

  return `“${thought}” from ${formatEntryTime(record.createdAt)}`
}

export default function ThoughtRecordItem({
  record,
  onDeleted,
  onEdit,
  onChallenge,
  onView,
  editDisabled = false,
  focusEdit = false,
  focusPrimary = false,
}: ThoughtRecordItemProps): ReactElement {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const editRef = useRef<HTMLButtonElement>(null)
  const primaryRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  const name = nameOf(record)

  // One button for both states, so focus stays on it when a saved challenge turns it into
  // "View challenge" a moment after the card appears.
  const primary = record.challenge
    ? onView && { label: 'View challenge', onClick: onView }
    : onChallenge && { label: 'Challenge this thought', onClick: onChallenge }

  useEffect(() => {
    if (focusEdit) {
      editRef.current?.focus()
    }
  }, [focusEdit])

  useEffect(() => {
    if (focusPrimary) {
      const target = primaryRef.current ?? editRef.current

      target?.focus()
    }
  }, [focusPrimary])

  useEffect(() => {
    if (confirming) {
      keepRef.current?.focus()
    } else if (wasConfirming.current) {
      deleteRef.current?.focus()
    }
    wasConfirming.current = confirming
  }, [confirming])

  async function confirmDelete(): Promise<void> {
    setDeleting(true)
    setErrorMessage(null)

    try {
      await deleteThoughtRecord(record.id)
      onDeleted()
    } catch (error) {
      console.error('Thought record could not be deleted', error)
      setErrorMessage(DELETE_FAILED)
      setDeleting(false)
    }
  }

  return (
    <Box as="li" bg="bg" borderWidth="1px" borderColor="border" borderRadius="xl" p="4">
      <Stack gap="2">
        {record.situation ? (
          <Text fontSize="sm" color="fg.muted" overflowWrap="anywhere">
            {record.situation}
          </Text>
        ) : null}
        <Text fontSize="lg" fontWeight="semibold" color="colorPalette.fg" overflowWrap="anywhere">
          {record.thought}
        </Text>
        {record.challenge ? (
          <Stack gap="1">
            <Text fontSize="sm" fontWeight="bold" color="colorPalette.fg">
              Challenged
            </Text>
            <Text overflowWrap="anywhere">{record.challenge.balanced}</Text>
          </Stack>
        ) : null}
        <Stack gap="1">
          {record.emotions.map(({ emotion, intensity }) => (
            <Flex key={emotion} justify="space-between" align="baseline" gap="3">
              <Text>{emotionLabel(emotion)}</Text>
              <Text fontSize="sm" color="fg.muted">
                <VisuallyHidden>Intensity </VisuallyHidden>
                {intensity}/{INTENSITY_MAX}
              </Text>
            </Flex>
          ))}
        </Stack>
        <Flex justify="space-between" align="baseline" gap="3">
          <Text>Belief in the thought</Text>
          {record.challenge ? (
            <Text fontSize="sm" color="fg.muted">
              <VisuallyHidden>
                From {record.belief} to {record.challenge.belief} out of {BELIEF_MAX}
              </VisuallyHidden>
              <span aria-hidden="true">
                {record.belief} → {record.challenge.belief}
              </span>
            </Text>
          ) : (
            <Text fontSize="sm" color="fg.muted">
              {record.belief}/{BELIEF_MAX}
            </Text>
          )}
        </Flex>
      </Stack>

      {confirming ? (
        <Box mt="3" role="group" aria-label={`Delete the thought record ${name}`}>
          <Text fontWeight="semibold">Delete this record? This cannot be undone.</Text>
          {errorMessage ? (
            <Box role="alert" mt="2" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
              {errorMessage}
            </Box>
          ) : null}
          <Flex mt="3" gap="2">
            <Button
              ref={keepRef}
              variant="outline"
              minH="12"
              flex="1"
              disabled={deleting}
              onClick={() => {
                setConfirming(false)
                setErrorMessage(null)
              }}
            >
              Keep
            </Button>
            <Button
              colorPalette="red"
              minH="12"
              flex="1"
              disabled={deleting}
              onClick={() => {
                void confirmDelete()
              }}
            >
              {deleting ? 'Deleting…' : 'Yes, delete'}
            </Button>
          </Flex>
        </Box>
      ) : (
        <>
          {primary ? (
            <Button
              ref={primaryRef}
              size="lg"
              minH="12"
              width="full"
              mt="3"
              disabled={editDisabled}
              aria-label={`${primary.label}: ${name}`}
              onClick={primary.onClick}
            >
              {primary.label}
            </Button>
          ) : null}
          <Flex mt="2" justify="space-between" align="center" gap="3">
            <chakra.time
              fontSize="sm"
              color="fg.subtle"
              dateTime={new Date(record.createdAt).toISOString()}
            >
              {formatEntryTime(record.createdAt)}
            </chakra.time>
            <Flex gap="1">
              {onEdit ? (
                <Button
                  ref={editRef}
                  variant="ghost"
                  minH="12"
                  disabled={editDisabled}
                  aria-label={`Edit the thought record ${name}`}
                  onClick={onEdit}
                >
                  <LuPencil aria-hidden="true" />
                  Edit
                </Button>
              ) : null}
              <Button
                ref={deleteRef}
                variant="ghost"
                minH="12"
                aria-label={`Delete the thought record ${name}`}
                onClick={() => {
                  setConfirming(true)
                }}
              >
                <LuTrash2 aria-hidden="true" />
                Delete
              </Button>
            </Flex>
          </Flex>
        </>
      )}
    </Box>
  )
}
