import { Box, Button, chakra, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useEffect, useId, useRef, useState } from 'react'

import { BODY_AREAS, type BodyArea, bodyAreaLabel, type BodyNote } from './body'
import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from './errors'
import { saveThoughtBody } from './repository'
import { TEXT_MAX_LENGTH, type ThoughtRecord } from './types'

type BodyFormProps = {
  /** The record whose body notes are noted or changed. */
  record: ThoughtRecord
  onDone: () => void
  onSaved?: () => void
}

/** The areas chosen, each with what the user wrote about it so far (an empty string for nothing). */
type Descriptions = Readonly<Partial<Record<BodyArea, string>>>

const SAVE_FAILED = 'Your notes could not be saved right now. Please try again.'

function fromRecord(record: ThoughtRecord): Descriptions {
  return Object.fromEntries(
    (record.body ?? []).map(({ area, description }) => [area, description ?? '']),
  )
}

function differs(first: Descriptions, second: Descriptions): boolean {
  return BODY_AREAS.some(
    (area) => area in first !== area in second || (first[area] ?? '') !== (second[area] ?? ''),
  )
}

/**
 * Where the body reacts to a thought: the areas the user switches on, each with an optional word
 * or two. One screen, with its own Cancel and discard question. Nothing is saved before Save.
 */
export default function BodyForm({ record, onDone, onSaved }: BodyFormProps): ReactElement {
  const [start] = useState(() => fromRecord(record))
  const [descriptions, setDescriptions] = useState<Descriptions>(start)
  const [asking, setAsking] = useState(false)
  const [gone, setGone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const idPrefix = useId()

  const changed = differs(descriptions, start)

  useEffect(() => {
    if (gone) {
      closeRef.current?.focus()
    } else if (asking) {
      keepRef.current?.focus()
    } else {
      headingRef.current?.focus()
    }
  }, [asking, gone])

  function toggle(area: BodyArea): void {
    setDescriptions((current) =>
      area in current
        ? Object.fromEntries(Object.entries(current).filter(([key]) => key !== area))
        : { ...current, [area]: '' },
    )
  }

  function describe(area: BodyArea, value: string): void {
    setDescriptions((current) => ({ ...current, [area]: value }))
  }

  function close(): void {
    if (changed && !gone) {
      setAsking(true)
    } else {
      onDone()
    }
  }

  async function save(): Promise<void> {
    if (saving) {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const notes: BodyNote[] = BODY_AREAS.filter((area) => area in descriptions).map((area) => ({
        area,
        description: descriptions[area] ?? '',
      }))

      await saveThoughtBody(record.id, notes)
      onSaved?.()
      onDone()
    } catch (error) {
      if (error instanceof ThoughtRecordNotFoundError) {
        setGone(true)
        setErrorMessage(error.message)
      } else if (error instanceof InvalidThoughtRecordError) {
        setErrorMessage(error.message)
      } else {
        console.error('Body notes could not be saved', error)
        setErrorMessage(SAVE_FAILED)
      }
      setSaving(false)
    }
  }

  return (
    <Box
      as="section"
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
      aria-label="Note body reactions"
    >
      <Stack gap="6">
        <Flex justify="space-between" align="center" gap="3">
          <Heading
            as="h2"
            ref={headingRef}
            tabIndex={-1}
            size="lg"
            color="colorPalette.fg"
            outline="none"
          >
            {asking ? 'Discard these notes?' : 'Body reactions'}
          </Heading>
          {gone || asking ? null : (
            <Button variant="ghost" minH="12" disabled={saving} onClick={close}>
              Cancel
            </Button>
          )}
        </Flex>

        {gone ? (
          <Stack gap="4">
            <Box role="alert" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
              {errorMessage}
            </Box>
            <Button ref={closeRef} variant="outline" size="lg" minH="12" onClick={onDone}>
              Close
            </Button>
          </Stack>
        ) : asking ? (
          <Box role="group" aria-label="Discard these notes?">
            <Text>What you changed will not be saved.</Text>
            <Flex mt="4" gap="2">
              <Button
                ref={keepRef}
                variant="outline"
                minH="12"
                flex="1"
                onClick={() => {
                  setAsking(false)
                }}
              >
                Keep editing
              </Button>
              <Button colorPalette="red" minH="12" flex="1" onClick={onDone}>
                Yes, discard
              </Button>
            </Flex>
          </Box>
        ) : (
          <>
            <chakra.fieldset border="0" m="0" p="0" minW="0">
              <chakra.legend mb="1" fontWeight="semibold">
                Where do you feel it?
              </chakra.legend>
              <Text mb="3" fontSize="sm" color="fg.muted">
                Switch on each place where you notice a reaction in your body.
              </Text>
              <Flex wrap="wrap" gap="2">
                {BODY_AREAS.map((area) => (
                  <chakra.label key={area} position="relative" display="inline-flex">
                    {/* The real checkbox sits invisibly over its chip, so a tap anywhere on the chip hits it. */}
                    <chakra.input
                      className="peer"
                      type="checkbox"
                      name="body-area"
                      value={area}
                      checked={area in descriptions}
                      onChange={() => {
                        toggle(area)
                      }}
                      position="absolute"
                      inset="0"
                      m="0"
                      width="full"
                      height="full"
                      opacity="0"
                      cursor="pointer"
                    />
                    <chakra.span
                      display="inline-flex"
                      alignItems="center"
                      justifyContent="center"
                      minH="12"
                      px="4"
                      borderWidth="1px"
                      borderColor="border.emphasized"
                      borderRadius="full"
                      bg="bg"
                      color="fg"
                      fontWeight="medium"
                      _peerChecked={{
                        bg: 'colorPalette.subtle',
                        borderColor: 'colorPalette.solid',
                        color: 'colorPalette.fg',
                        fontWeight: 'bold',
                      }}
                      _peerFocusVisible={{
                        outline: '2px solid',
                        outlineColor: 'colorPalette.focusRing',
                        outlineOffset: '2px',
                      }}
                    >
                      {bodyAreaLabel(area)}
                    </chakra.span>
                  </chakra.label>
                ))}
              </Flex>
            </chakra.fieldset>

            {BODY_AREAS.some((area) => area in descriptions) ? (
              <Stack gap="4">
                {BODY_AREAS.filter((area) => area in descriptions).map((area) => {
                  const fieldId = `${idPrefix}-${area}`

                  return (
                    <Box key={area}>
                      <chakra.label htmlFor={fieldId} display="block" mb="1" fontWeight="semibold">
                        {bodyAreaLabel(area)}: what does it feel like?
                      </chakra.label>
                      <chakra.input
                        id={fieldId}
                        type="text"
                        value={descriptions[area] ?? ''}
                        maxLength={TEXT_MAX_LENGTH}
                        placeholder="Optional, for example tight or racing"
                        onChange={(event) => {
                          describe(area, event.target.value)
                        }}
                        width="full"
                        minH="12"
                        px="3"
                        borderWidth="1px"
                        borderColor="border.emphasized"
                        borderRadius="lg"
                        bg="bg"
                        _focusVisible={{
                          outline: '2px solid',
                          outlineColor: 'colorPalette.focusRing',
                          outlineOffset: '2px',
                        }}
                      />
                    </Box>
                  )
                })}
              </Stack>
            ) : null}

            {errorMessage ? (
              <Box role="alert" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
                {errorMessage}
              </Box>
            ) : null}

            <Button
              size="lg"
              minH="12"
              width="full"
              disabled={saving || !changed}
              onClick={() => {
                void save()
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        )}
      </Stack>
    </Box>
  )
}
