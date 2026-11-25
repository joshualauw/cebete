import { Box, chakra, Flex, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef } from 'react'
import { LuCheck } from 'react-icons/lu'
import { Link } from 'react-router'

import { formatEntryTime } from '@/mood/format'
import { thoughtRecordPath } from '@/navigation/paths'

import type { ThoughtRecord } from './types'

const RecordLink = chakra(Link)

/** The parts of the record the user has completed, in the order they show on the card. */
function completedParts(record: ThoughtRecord): readonly string[] {
  const parts: string[] = []

  if (record.challenge) {
    parts.push('Challenged')
  }

  // A planned test is not completed yet, so it is not listed.
  if (record.test?.status === 'done') {
    parts.push('Tested')
  }

  if (record.body && record.body.length > 0) {
    parts.push('Body noted')
  }

  return parts
}

type ThoughtRecordItemProps = {
  record: ThoughtRecord
  /** Told when the card is opened, before the record screen replaces the list. */
  onOpen?: () => void
  /** Makes the card inert, for example while the capture flow is open. */
  locked?: boolean
  /** Moves focus to the card when it appears, after the user came back from its record. */
  focus?: boolean
}

/**
 * A short summary of a record that opens the whole record. The whole card is the link, so it
 * has one large target and nothing else to aim at.
 */
export default function ThoughtRecordItem({
  record,
  onOpen,
  locked = false,
  focus = false,
}: ThoughtRecordItemProps): ReactElement {
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (focus) {
      linkRef.current?.focus()
    }
  }, [focus])

  return (
    <Box as="li" bg="bg" borderWidth="1px" borderColor="border" borderRadius="xl">
      <RecordLink
        ref={linkRef}
        to={thoughtRecordPath(record.id)}
        display="block"
        p="4"
        borderRadius="xl"
        color="inherit"
        textDecoration="none"
        minH="12"
        aria-disabled={locked ? true : undefined}
        tabIndex={locked ? -1 : undefined}
        opacity={locked ? 0.6 : 1}
        _focusVisible={{
          outline: '2px solid',
          outlineColor: 'colorPalette.focusRing',
          outlineOffset: '2px',
        }}
        onClick={(event) => {
          if (locked) {
            event.preventDefault()
          } else {
            onOpen?.()
          }
        }}
      >
        <Stack gap="2">
          {record.situation ? (
            <Text fontSize="sm" color="fg.muted" overflowWrap="anywhere">
              {record.situation}
            </Text>
          ) : null}
          <Text fontSize="lg" fontWeight="semibold" color="colorPalette.fg" overflowWrap="anywhere">
            {record.thought}
          </Text>
          {completedParts(record).map((label) => (
            <Flex key={label} align="center" gap="2" color="colorPalette.fg">
              <LuCheck aria-hidden="true" />
              <Text as="span" fontSize="sm" fontWeight="bold">
                {label}
              </Text>
            </Flex>
          ))}
          <chakra.time
            fontSize="sm"
            color="fg.subtle"
            dateTime={new Date(record.createdAt).toISOString()}
          >
            {formatEntryTime(record.createdAt)}
          </chakra.time>
        </Stack>
      </RecordLink>
    </Box>
  )
}
