import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'
import { LuChevronDown, LuChevronUp } from 'react-icons/lu'

import { emotionLabel } from '@/mood/emotions'
import { formatEntryTime } from '@/mood/format'
import { INTENSITY_MAX } from '@/mood/types'

import { BELIEF_MAX, type ThoughtRecord } from './types'

type RecordSummaryProps = {
  record: ThoughtRecord
  open: boolean
  onToggle: () => void
}

type FactProps = {
  label: string
  children: string
}

function Fact({ label, children }: FactProps): ReactElement {
  return (
    <Flex justify="space-between" align="baseline" gap="3">
      <Text fontSize="sm" color="fg.muted" flexShrink="0">
        {label}
      </Text>
      <Text textAlign="end" overflowWrap="anywhere" whiteSpace="pre-wrap">
        {children}
      </Text>
    </Flex>
  )
}

/**
 * Reminds the user what a record is about while they work on it: the thought as one line, and a
 * button that shows the rest as it was captured. A part the record does not have is left out.
 */
export default function RecordSummary({
  record,
  open,
  onToggle,
}: RecordSummaryProps): ReactElement {
  const panelId = useId()

  return (
    <Box bg="bg.subtle" borderRadius="lg" p="3">
      <Text
        fontWeight="semibold"
        color="colorPalette.fg"
        overflowWrap="anywhere"
        {...(open ? {} : { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' })}
      >
        {record.thought}
      </Text>
      <Button
        variant="ghost"
        minH="12"
        width="full"
        justifyContent="space-between"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={onToggle}
      >
        {open ? 'Hide the record' : 'See the whole record'}
        {open ? <LuChevronUp aria-hidden="true" /> : <LuChevronDown aria-hidden="true" />}
      </Button>
      {open ? (
        <Stack id={panelId} role="region" aria-label="The whole record" gap="2" pt="1">
          {record.situation ? <Fact label="The situation">{record.situation}</Fact> : null}
          {record.emotions.map(({ emotion, intensity }) => (
            <Fact key={emotion} label="Felt">
              {`${emotionLabel(emotion)} ${String(intensity)}/${String(INTENSITY_MAX)}`}
            </Fact>
          ))}
          {record.action ? <Fact label="What you did">{record.action}</Fact> : null}
          <Fact label="Belief in the thought">{`${String(record.belief)}/${String(BELIEF_MAX)}`}</Fact>
          <Fact label="When it happened">{formatEntryTime(record.createdAt)}</Fact>
        </Stack>
      ) : null}
    </Box>
  )
}
