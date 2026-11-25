import { Box, Button, Flex, Heading, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef } from 'react'

import { emotionLabel } from '@/mood/emotions'
import { INTENSITY_MAX } from '@/mood/types'

import { BELIEF_MAX, type ThoughtChallenge, type ThoughtRecord } from './types'

type ChallengeViewProps = {
  record: ThoughtRecord
  challenge: ThoughtChallenge
  onClose: () => void
  onRevise: () => void
}

type PartProps = {
  label: string
  children: string
}

function Part({ label, children }: PartProps): ReactElement {
  return (
    <Box>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text overflowWrap="anywhere" whiteSpace="pre-wrap">
        {children}
      </Text>
    </Box>
  )
}

type ChangeProps = {
  label: string
  before: number
  now: number
  max: number
}

function Change({ label, before, now, max }: ChangeProps): ReactElement {
  return (
    <Flex justify="space-between" align="baseline" gap="3">
      <Text>{label}</Text>
      <Text fontSize="sm" color="fg.muted">
        <VisuallyHidden>
          From {before} to {now} out of {max}
        </VisuallyHidden>
        <span aria-hidden="true">
          {before} → {now}
        </span>
      </Text>
    </Flex>
  )
}

/**
 * A challenge in full, for reading: the thought, the evidence, the balanced thought, and how
 * the belief and each feeling changed. Nothing here can be edited until the user chooses to
 * revise the challenge.
 */
export default function ChallengeView({
  record,
  challenge,
  onClose,
  onRevise,
}: ChallengeViewProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <Box
      as="section"
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
      aria-label="Your challenge"
    >
      <Stack gap="5">
        <Heading
          as="h2"
          ref={headingRef}
          tabIndex={-1}
          size="lg"
          color="colorPalette.fg"
          outline="none"
        >
          Your challenge
        </Heading>

        {record.situation ? <Part label="The situation">{record.situation}</Part> : null}
        <Part label="The thought">{record.thought}</Part>
        {record.action ? <Part label="What you did">{record.action}</Part> : null}
        {challenge.evidenceFor ? (
          <Part label="What speaks for it">{challenge.evidenceFor}</Part>
        ) : null}
        {challenge.evidenceAgainst ? (
          <Part label="What speaks against it">{challenge.evidenceAgainst}</Part>
        ) : null}
        <Part label="A more balanced thought">{challenge.balanced}</Part>

        <Stack gap="1">
          <Text fontSize="sm" color="fg.muted">
            Before and now
          </Text>
          <Change
            label="Belief in the thought"
            before={record.belief}
            now={challenge.belief}
            max={BELIEF_MAX}
          />
          {record.emotions.map(({ emotion, intensity }) => (
            <Change
              key={emotion}
              label={emotionLabel(emotion)}
              before={intensity}
              now={
                challenge.emotions.find((rated) => rated.emotion === emotion)?.intensity ??
                intensity
              }
              max={INTENSITY_MAX}
            />
          ))}
        </Stack>

        <Flex gap="3">
          <Button variant="outline" size="lg" minH="12" flex="1" onClick={onClose}>
            Close
          </Button>
          <Button size="lg" minH="12" flex="1" onClick={onRevise}>
            Revise challenge
          </Button>
        </Flex>
      </Stack>
    </Box>
  )
}
