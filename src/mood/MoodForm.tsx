import { Box, Button, chakra, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, type SubmitEvent, useEffect, useId, useRef, useState } from 'react'

import EmotionPicker from './EmotionPicker'
import EmotionRatings from './EmotionRatings'
import type { Emotion } from './emotions'
import { fromDateTimeFieldValue, toDateTimeFieldValue } from './format'
import { MoodEntryNotFoundError } from './errors'
import { addMoodEntry, updateMoodEntry } from './repository'
import {
  type EmotionRating,
  INTENSITY_DEFAULT,
  MAX_EMOTIONS,
  type MoodEntry,
  NOTE_MAX_LENGTH,
} from './types'
import { InvalidMoodEntryError } from './validation'

type MoodFormProps = {
  /** Called when the form should close, after a successful save or when the user cancels. */
  onDone: () => void
  /** Called after a save succeeds, just before the form closes. */
  onSaved?: () => void
  /** The entry to change. Without it the form adds a new entry. */
  entry?: MoodEntry
}

const SAVE_FAILED = 'Your entry could not be saved right now. Please try again.'

const fieldStyles = {
  width: 'full',
  borderWidth: '1px',
  borderColor: 'border.emphasized',
  borderRadius: 'lg',
  bg: 'bg',
  _focusVisible: {
    outline: '2px solid',
    outlineColor: 'colorPalette.focusRing',
    outlineOffset: '2px',
  },
} as const

/**
 * The form for a mood entry: one to three emotions, a 0 to 10 rating for each, and an optional
 * note. Given an entry it edits that entry instead, starting from its values, and also shows the
 * date and time it was recorded.
 */
export default function MoodForm({ onDone, onSaved, entry }: MoodFormProps): ReactElement {
  const id = useId()
  const titleId = `${id}-title`
  const noteId = `${id}-note`
  const noteCountId = `${id}-note-count`
  const timeId = `${id}-time`
  const saveHintId = `${id}-save-hint`

  const [ratings, setRatings] = useState<readonly EmotionRating[]>(entry?.emotions ?? [])
  const [note, setNote] = useState(entry?.note ?? '')
  // The field only shows the minute, so the time is left to the saved entry (or the moment of
  // saving) unless the user changes the field.
  const [initialTime] = useState(() => toDateTimeFieldValue(entry?.createdAt ?? Date.now()))
  const [time, setTime] = useState(initialTime)
  const [saving, setSaving] = useState(false)
  const [gone, setGone] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)

  const noneChosen = ratings.length === 0

  // Move focus into the form when it opens, so keyboard and screen reader users land in it.
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  /** Choose an emotion, or remove it if it is already chosen. A removed emotion loses its rating. */
  function toggleEmotion(emotion: Emotion): void {
    setRatings((current) => {
      if (current.some((rating) => rating.emotion === emotion)) {
        return current.filter((rating) => rating.emotion !== emotion)
      }

      if (current.length >= MAX_EMOTIONS) {
        return current
      }

      return [...current, { emotion, intensity: INTENSITY_DEFAULT }]
    })
  }

  function rate(emotion: Emotion, intensity: number): void {
    setRatings((current) =>
      current.map((rating) => (rating.emotion === emotion ? { ...rating, intensity } : rating)),
    )
  }

  async function save(): Promise<void> {
    if (noneChosen || saving) {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const chosen = time === initialTime ? undefined : fromDateTimeFieldValue(time)

      if (entry) {
        await updateMoodEntry(entry.id, {
          emotions: ratings,
          note,
          createdAt: chosen ?? entry.createdAt,
        })
      } else {
        await addMoodEntry(
          chosen === undefined
            ? { emotions: ratings, note }
            : { emotions: ratings, note, createdAt: chosen },
        )
      }
      onSaved?.()
      onDone()
    } catch (error) {
      if (error instanceof MoodEntryNotFoundError) {
        setGone(true)
        setErrorMessage(error.message)
      } else if (error instanceof InvalidMoodEntryError) {
        setErrorMessage(error.message)
      } else {
        console.error('Mood entry could not be saved', error)
        setErrorMessage(SAVE_FAILED)
      }
      // Everything the user chose and typed stays in the form, so they can simply try again.
      setSaving(false)
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault()
    void save()
  }

  return (
    <Box
      as="section"
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
      aria-labelledby={titleId}
    >
      <chakra.form onSubmit={handleSubmit}>
        <Stack gap="6">
          <Heading
            as="h2"
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            size="lg"
            color="colorPalette.fg"
            outline="none"
          >
            {entry ? 'Edit entry' : 'New entry'}
          </Heading>

          <EmotionPicker
            selected={ratings.map(({ emotion }) => emotion)}
            onToggle={toggleEmotion}
          />

          <EmotionRatings ratings={ratings} onChange={rate} />

          <Box>
            <chakra.label htmlFor={noteId} display="block" mb="2" fontWeight="semibold">
              Note (optional)
            </chakra.label>
            <chakra.textarea
              id={noteId}
              value={note}
              onChange={(event) => {
                setNote(event.target.value)
              }}
              maxLength={NOTE_MAX_LENGTH}
              rows={3}
              aria-describedby={noteCountId}
              p="3"
              {...fieldStyles}
            />
            <Text id={noteCountId} mt="1" textAlign="end" fontSize="sm" color="fg.muted">
              {note.length}/{NOTE_MAX_LENGTH}
            </Text>
          </Box>

          <Box>
            <chakra.label htmlFor={timeId} display="block" mb="2" fontWeight="semibold">
              Date and time
            </chakra.label>
            <chakra.input
              id={timeId}
              type="datetime-local"
              value={time}
              disabled={gone}
              onChange={(event) => {
                setTime(event.target.value)
              }}
              minH="12"
              px="3"
              {...fieldStyles}
            />
          </Box>

          {errorMessage ? (
            <Box role="alert" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
              {errorMessage}
            </Box>
          ) : null}

          <Stack gap="2">
            <Flex gap="3">
              {gone ? null : (
                <Button
                  type="submit"
                  size="lg"
                  minH="12"
                  flex="1"
                  disabled={noneChosen || saving}
                  aria-describedby={noneChosen ? saveHintId : undefined}
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="lg"
                minH="12"
                disabled={saving}
                onClick={onDone}
              >
                Cancel
              </Button>
            </Flex>
            {noneChosen ? (
              <Text id={saveHintId} fontSize="sm" color="fg.muted">
                Choose how you feel to save your entry.
              </Text>
            ) : null}
          </Stack>
        </Stack>
      </chakra.form>
    </Box>
  )
}
