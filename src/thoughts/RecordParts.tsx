import { Box, Flex, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import type { ReactElement } from 'react'

import { emotionLabel } from '@/mood/emotions'
import { INTENSITY_MAX } from '@/mood/types'

import { BELIEF_MAX, type ThoughtChallenge, type ThoughtRecord } from './types'

type PartProps = {
  label: string
  children: string
}

/** A labelled piece of text the user wrote. */
export function Part({ label, children }: PartProps): ReactElement {
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

/** A rating before and now, as "7 → 3", with a spoken form for assistive technology. */
export function Change({ label, before, now, max }: ChangeProps): ReactElement {
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

type ChallengeDetailsProps = {
  record: ThoughtRecord
  challenge: ThoughtChallenge
}

/** What a challenge says: the evidence, the balanced thought, and how the ratings changed. */
export function ChallengeDetails({ record, challenge }: ChallengeDetailsProps): ReactElement {
  return (
    <>
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
              challenge.emotions.find((rated) => rated.emotion === emotion)?.intensity ?? intensity
            }
            max={INTENSITY_MAX}
          />
        ))}
      </Stack>
    </>
  )
}
