import { Box, Button, chakra, Flex, Heading, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, type ReactNode, useEffect, useId, useRef } from 'react'
import { LuPencil } from 'react-icons/lu'

import { emotionLabel } from '@/mood/emotions'
import { formatEntryTime } from '@/mood/format'
import { INTENSITY_MAX } from '@/mood/types'

import { bodyAreaLabel } from './body'
import { Change, ChallengeDetails, Part } from './RecordParts'
import { BELIEF_MAX, type ThoughtRecord } from './types'

type CardProps = {
  title: string
  children: ReactNode
}

function Card({ title, children }: CardProps): ReactElement {
  const headingId = useId()

  return (
    <Box
      as="section"
      aria-labelledby={headingId}
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
    >
      <Stack gap="4">
        <Heading as="h2" id={headingId} size="lg" color="colorPalette.fg">
          {title}
        </Heading>
        {children}
      </Stack>
    </Box>
  )
}

type ThoughtSectionProps = {
  record: ThoughtRecord
  /** Opens the edit. Without it the section offers no Edit. */
  onEdit?: () => void
  /** Switches Edit off, for example while another flow is open. */
  locked?: boolean
  /** Moves focus to Edit when the section appears, after the edit was closed. */
  focusEdit?: boolean
}

/** The record as it was captured. A part the record does not have is left out. */
export function ThoughtSection({
  record,
  onEdit,
  locked = false,
  focusEdit = false,
}: ThoughtSectionProps): ReactElement {
  const editRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focusEdit) {
      editRef.current?.focus()
    }
  }, [focusEdit])

  return (
    <Card title="The thought">
      {record.situation ? <Part label="The situation">{record.situation}</Part> : null}
      <Text
        fontSize="lg"
        fontWeight="semibold"
        color="colorPalette.fg"
        overflowWrap="anywhere"
        whiteSpace="pre-wrap"
      >
        {record.thought}
      </Text>
      <Stack gap="1">
        <Text fontSize="sm" color="fg.muted">
          How you felt
        </Text>
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
      {record.action ? <Part label="What you did">{record.action}</Part> : null}
      <Flex justify="space-between" align="baseline" gap="3">
        <Text>Belief in the thought</Text>
        <Text fontSize="sm" color="fg.muted">
          {record.belief}/{BELIEF_MAX}
        </Text>
      </Flex>
      <Flex justify="space-between" align="center" gap="3">
        <chakra.time
          fontSize="sm"
          color="fg.subtle"
          dateTime={new Date(record.createdAt).toISOString()}
        >
          {formatEntryTime(record.createdAt)}
        </chakra.time>
        {onEdit ? (
          <Button ref={editRef} variant="ghost" minH="12" disabled={locked} onClick={onEdit}>
            <LuPencil aria-hidden="true" />
            Edit
          </Button>
        ) : null}
      </Flex>
    </Card>
  )
}

type ChallengeSectionProps = {
  record: ThoughtRecord
  /** Opens the challenge, or its revision. Without it the section offers no action. */
  onChallenge?: () => void
  /** Switches the action off, for example while another flow is open. */
  locked?: boolean
  /** Moves focus to the action when the section appears, after the challenge was closed. */
  focusAction?: boolean
}

/** What the user found when they challenged the thought, or a gentle prompt to do so. */
export function ChallengeSection({
  record,
  onChallenge,
  locked = false,
  focusAction = false,
}: ChallengeSectionProps): ReactElement {
  const actionRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (focusAction) {
      actionRef.current?.focus()
    }
  }, [focusAction])

  return (
    <Card title="Challenge">
      {record.challenge ? (
        <ChallengeDetails record={record} challenge={record.challenge} />
      ) : (
        <Text color="fg.muted">
          This thought has not been challenged yet. When you feel calmer, look at the evidence and
          find a more balanced thought.
        </Text>
      )}
      {onChallenge ? (
        // One button for both states, so focus stays on it when a saved challenge turns it
        // into "Revise challenge" a moment after the section appears.
        <Button
          ref={actionRef}
          size="lg"
          minH="12"
          width="full"
          variant={record.challenge ? 'outline' : 'solid'}
          disabled={locked}
          onClick={onChallenge}
        >
          {record.challenge ? 'Revise challenge' : 'Challenge this thought'}
        </Button>
      ) : null}
    </Card>
  )
}

type BodySectionProps = {
  record: ThoughtRecord
  /** Opens the form. Without it the section offers no action. */
  onEdit?: () => void
  /** Switches the action off, for example while another flow is open. */
  locked?: boolean
  /** Moves focus to the action when the section appears, after the form was closed. */
  focusAction?: boolean
}

/** Where the body reacts to the thought, or a gentle prompt to note it. */
export function BodySection({
  record,
  onEdit,
  locked = false,
  focusAction = false,
}: BodySectionProps): ReactElement {
  const actionRef = useRef<HTMLButtonElement>(null)
  const notes = record.body ?? []

  useEffect(() => {
    if (focusAction) {
      actionRef.current?.focus()
    }
  }, [focusAction])

  return (
    <Card title="Body">
      {notes.length === 0 ? (
        <Text color="fg.muted">
          Worry is often felt in the body. Note where you feel it, and what it is like.
        </Text>
      ) : (
        <Stack as="ul" gap="3" listStyleType="none" m="0" p="0">
          {notes.map(({ area, description }) => (
            <li key={area}>
              <Text fontWeight="semibold">{bodyAreaLabel(area)}</Text>
              {description ? (
                <Text overflowWrap="anywhere" whiteSpace="pre-wrap">
                  {description}
                </Text>
              ) : null}
            </li>
          ))}
        </Stack>
      )}
      {onEdit ? (
        // One button for both states, so focus stays on it when saved notes change its wording.
        <Button
          ref={actionRef}
          size="lg"
          minH="12"
          width="full"
          variant={notes.length === 0 ? 'solid' : 'outline'}
          disabled={locked}
          onClick={onEdit}
        >
          {notes.length === 0 ? 'Note body reactions' : 'Edit body reactions'}
        </Button>
      ) : null}
    </Card>
  )
}

type TestSectionProps = {
  record: ThoughtRecord
  /** Opens the plan, the first one or its revision. Without it the section offers no plan action. */
  onPlan?: () => void
  /** Opens the result, the first one or its revision. Without it the section offers no result action. */
  onLogResult?: () => void
  /** Switches the actions off, for example while another flow is open. */
  locked?: boolean
  /** Moves focus to an action when the section appears, after the flow it opened was closed. */
  focusAction?: 'plan' | 'result' | null
}

/** A real-life test of the thought: planned first, then its result. */
export function TestSection({
  record,
  onPlan,
  onLogResult,
  locked = false,
  focusAction = null,
}: TestSectionProps): ReactElement {
  const planRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<HTMLButtonElement>(null)
  const test = record.test

  useEffect(() => {
    if (focusAction === 'plan') {
      planRef.current?.focus()
    } else if (focusAction === 'result') {
      resultRef.current?.focus()
    }
  }, [focusAction])

  return (
    <Card title="Test">
      {test === undefined ? (
        <Text color="fg.muted">
          This thought has not been tested yet. Plan something small you can try in real life, then
          compare what happens with what you predicted.
        </Text>
      ) : (
        <>
          {test.status === 'planned' ? (
            <Text fontSize="sm" fontWeight="bold" color="colorPalette.fg">
              Test planned
            </Text>
          ) : null}
          <Part label="How and when">{test.plan}</Part>
          <Part label="What you predict">{test.prediction}</Part>
          {test.status === 'done' ? (
            <>
              <Part label="What happened">{test.result}</Part>
              <Stack gap="1">
                <Text fontSize="sm" color="fg.muted">
                  Before and now
                </Text>
                <Change
                  label="Belief in the thought"
                  before={record.belief}
                  now={test.belief}
                  max={BELIEF_MAX}
                />
              </Stack>
            </>
          ) : null}
        </>
      )}
      {/* The result button keeps its place when it turns from "Log the result" into "Revise the
          result", so focus stays on it after a save. The same goes for the plan button. */}
      {onLogResult && test ? (
        <Button
          ref={resultRef}
          size="lg"
          minH="12"
          width="full"
          variant={test.status === 'planned' ? 'solid' : 'outline'}
          disabled={locked}
          onClick={onLogResult}
        >
          {test.status === 'planned' ? 'Log the result' : 'Revise the result'}
        </Button>
      ) : null}
      {onPlan ? (
        <Button
          ref={planRef}
          size="lg"
          minH="12"
          width="full"
          variant={test ? 'outline' : 'solid'}
          disabled={locked}
          onClick={onPlan}
        >
          {test ? 'Revise the plan' : 'Plan a test'}
        </Button>
      ) : null}
    </Card>
  )
}
