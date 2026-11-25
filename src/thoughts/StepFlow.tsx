import { Box, Button, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, type ReactNode, useEffect, useId, useRef, useState } from 'react'

import StepMarkers, { type StepMarkerState } from './StepMarkers'

export type FlowStep = {
  readonly title: string
  readonly content: ReactNode
  /** An optional step offers Skip while it is empty. */
  readonly optional?: boolean
  readonly empty?: boolean
  /** What is needed before going on, when this step is required and not yet filled. */
  readonly needs?: string | null
}

type StepFlowProps = {
  /** The name of the whole flow for assistive technology, for example "New thought record". */
  label: string
  /** What the step line starts with, for example "New record". */
  eyebrow: string
  /** The question asked before something typed is thrown away. */
  discardTitle: string
  steps: readonly FlowStep[]
  /** Something shown on every step, between the markers and the step title. */
  aboveStep?: ReactNode
  /** The furthest step already reached when the flow opens. Zero for a new flow. */
  reachedAtStart?: number
  /** Whether anything was entered or changed, so that closing asks first. */
  changed: boolean
  saving: boolean
  /** The thing being changed no longer exists, so only closing is offered. */
  gone: boolean
  errorMessage: string | null
  onSave: () => void
  onClose: () => void
}

/**
 * The shared shell of a guided flow: one question per screen, step markers to jump between
 * steps, Back, Skip and Next, a final Save, and the question before something typed is
 * discarded. Each flow supplies its steps and what saving does.
 */
export default function StepFlow({
  label,
  eyebrow,
  discardTitle,
  steps,
  aboveStep,
  reachedAtStart = 0,
  changed,
  saving,
  gone,
  errorMessage,
  onSave,
  onClose,
}: StepFlowProps): ReactElement {
  const waitingId = useId()
  const [step, setStep] = useState(0)
  const [furthest, setFurthest] = useState(reachedAtStart)
  const [asking, setAsking] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const wasAsking = useRef(false)

  const last = steps.length - 1
  const current = steps[step]

  useEffect(() => {
    headingRef.current?.focus()
  }, [step])

  useEffect(() => {
    if (gone) {
      closeRef.current?.focus()
    }
  }, [gone])

  useEffect(() => {
    if (asking) {
      keepRef.current?.focus()
    } else if (wasAsking.current) {
      headingRef.current?.focus()
    }
    wasAsking.current = asking
  }, [asking])

  function goTo(index: number): void {
    setStep(index)
    setFurthest((reached) => Math.max(reached, index))
  }

  function blockedBy(index: number): string | null {
    if (index <= step) {
      return null
    }

    return steps.slice(0, index).find((earlier) => earlier.needs)?.needs ?? null
  }

  const markers: readonly StepMarkerState[] = steps.map(({ title, needs }, index) => ({
    title,
    finished: index !== step && index <= furthest && !needs,
    blockedBy: blockedBy(index),
  }))

  function close(): void {
    if (changed && !gone) {
      setAsking(true)
    } else {
      onClose()
    }
  }

  const waitingFor = current?.needs ?? null
  const skipping = current?.optional === true && current.empty === true

  return (
    <Box
      as="section"
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
      aria-label={label}
    >
      <Stack gap="6">
        <Flex justify="space-between" align="center" gap="3">
          <Text fontSize="sm" color="fg.muted">
            {eyebrow} · Step {step + 1} of {steps.length}
          </Text>
          {gone ? null : (
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
            <Button ref={closeRef} variant="outline" size="lg" minH="12" onClick={onClose}>
              Close
            </Button>
          </Stack>
        ) : asking ? (
          <Box role="group" aria-label={discardTitle}>
            <Heading as="h2" ref={headingRef} tabIndex={-1} size="lg" outline="none">
              {discardTitle}
            </Heading>
            <Text mt="2">What you wrote will not be saved.</Text>
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
              <Button colorPalette="red" minH="12" flex="1" onClick={onClose}>
                Yes, discard
              </Button>
            </Flex>
          </Box>
        ) : (
          <>
            <StepMarkers markers={markers} current={step} onSelect={goTo} />
            {aboveStep}
            <Heading
              as="h2"
              ref={headingRef}
              tabIndex={-1}
              size="lg"
              color="colorPalette.fg"
              outline="none"
            >
              {current?.title}
            </Heading>

            {current?.content}

            {errorMessage ? (
              <Box role="alert" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
                {errorMessage}
              </Box>
            ) : null}

            <Stack gap="2">
              <Flex gap="3">
                {step > 0 ? (
                  <Button
                    variant="outline"
                    size="lg"
                    minH="12"
                    disabled={saving}
                    onClick={() => {
                      setStep(step - 1)
                    }}
                  >
                    Back
                  </Button>
                ) : null}
                {step === last ? (
                  <Button size="lg" minH="12" flex="1" disabled={saving} onClick={onSave}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    minH="12"
                    flex="1"
                    disabled={waitingFor !== null}
                    aria-describedby={waitingFor ? waitingId : undefined}
                    onClick={() => {
                      goTo(step + 1)
                    }}
                  >
                    {skipping ? 'Skip' : 'Next'}
                  </Button>
                )}
              </Flex>
              {waitingFor ? (
                <Text id={waitingId} fontSize="sm" color="fg.muted">
                  {waitingFor}
                </Text>
              ) : null}
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  )
}
