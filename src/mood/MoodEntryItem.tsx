import { Box, Button, chakra, Flex, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuTrash2 } from 'react-icons/lu'

import { emotionLabel } from './emotions'
import { formatEntryTime, joinEmotionLabels } from './format'
import { deleteMoodEntry } from './repository'
import { INTENSITY_MAX, type MoodEntry } from './types'

type MoodEntryItemProps = {
  entry: MoodEntry
  /** Called after the entry has been deleted. */
  onDeleted: () => void
}

const DELETE_FAILED = 'This entry could not be deleted right now. Please try again.'

/** One mood entry: each emotion with its rating, the note if any, and when it was recorded. */
export default function MoodEntryItem({ entry, onDeleted }: MoodEntryItemProps): ReactElement {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const wasConfirming = useRef(false)

  const labels = joinEmotionLabels(entry.emotions)
  const time = formatEntryTime(entry.createdAt)

  // Focus the safe choice when the question opens, and return to Delete when it is dismissed.
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
      await deleteMoodEntry(entry.id)
      onDeleted()
    } catch (error) {
      console.error('Mood entry could not be deleted', error)
      // The entry and the question stay, so the user can simply try again.
      setErrorMessage(DELETE_FAILED)
      setDeleting(false)
    }
  }

  return (
    <Box as="li" bg="bg" borderWidth="1px" borderColor="border" borderRadius="xl" p="4">
      <Stack gap="1">
        {entry.emotions.map(({ emotion, intensity }) => (
          <Flex key={emotion} justify="space-between" align="baseline" gap="3">
            <Text fontSize="lg" fontWeight="semibold" color="colorPalette.fg">
              {emotionLabel(emotion)}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              <VisuallyHidden>Intensity </VisuallyHidden>
              {intensity}/{INTENSITY_MAX}
            </Text>
          </Flex>
        ))}
      </Stack>
      {entry.note ? (
        <Text mt="2" whiteSpace="pre-wrap" overflowWrap="anywhere">
          {entry.note}
        </Text>
      ) : null}

      {confirming ? (
        <Box mt="3" role="group" aria-label={`Delete the ${labels} entry from ${time}`}>
          <Text fontWeight="semibold">Delete this entry? This cannot be undone.</Text>
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
        <Flex mt="2" justify="space-between" align="center" gap="3">
          <chakra.time
            fontSize="sm"
            color="fg.subtle"
            dateTime={new Date(entry.createdAt).toISOString()}
          >
            {time}
          </chakra.time>
          <Button
            ref={deleteRef}
            variant="ghost"
            minH="12"
            aria-label={`Delete the ${labels} entry from ${time}`}
            onClick={() => {
              setConfirming(true)
            }}
          >
            <LuTrash2 aria-hidden="true" />
            Delete
          </Button>
        </Flex>
      )}
    </Box>
  )
}
