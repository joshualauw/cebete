import { Box, chakra, Text } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import { BELIEF_MAX, BELIEF_MIN, TEXT_MAX_LENGTH } from './types'

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

type TextStepProps = {
  label: string
  hint: string
  value: string
  onChange: (value: string) => void
}

export function TextStep({ label, hint, value, onChange }: TextStepProps): ReactElement {
  const id = useId()
  const countId = `${id}-count`

  return (
    <Box>
      <chakra.label htmlFor={id} display="block" mb="1" fontWeight="semibold">
        {label}
      </chakra.label>
      <Text mb="2" fontSize="sm" color="fg.muted">
        {hint}
      </Text>
      <chakra.textarea
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        maxLength={TEXT_MAX_LENGTH}
        rows={4}
        aria-describedby={countId}
        p="3"
        {...fieldStyles}
      />
      <Text id={countId} mt="1" textAlign="end" fontSize="sm" color="fg.muted">
        {value.length}/{TEXT_MAX_LENGTH}
      </Text>
    </Box>
  )
}

type BeliefStepProps = {
  value: number
  onChange: (value: number) => void
  label?: string
}

export function BeliefStep({
  value,
  onChange,
  label = 'How strongly do you believe this thought?',
}: BeliefStepProps): ReactElement {
  const id = useId()

  return (
    <Box>
      <chakra.label htmlFor={id} display="block" mb="1" fontWeight="semibold">
        {label}
      </chakra.label>
      <Text mb="3" fontSize="sm" color="fg.muted">
        {BELIEF_MIN} means not at all, {BELIEF_MAX} means completely.
      </Text>
      <Box display="flex" justifyContent="flex-end" mb="2">
        <chakra.output htmlFor={id} fontWeight="bold" color="colorPalette.fg">
          {value}/{BELIEF_MAX}
        </chakra.output>
      </Box>
      <chakra.input
        id={id}
        type="range"
        min={BELIEF_MIN}
        max={BELIEF_MAX}
        step={1}
        value={value}
        onChange={(event) => {
          onChange(Number(event.target.value))
        }}
        aria-valuetext={`${String(value)} out of ${String(BELIEF_MAX)}`}
        width="full"
        height="12"
        accentColor="colorPalette.solid"
      />
    </Box>
  )
}

type TimeStepProps = {
  value: string
  onChange: (value: string) => void
}

export function TimeStep({ value, onChange }: TimeStepProps): ReactElement {
  const id = useId()

  return (
    <Box>
      <chakra.label htmlFor={id} display="block" mb="1" fontWeight="semibold">
        Date and time
      </chakra.label>
      <Text mb="2" fontSize="sm" color="fg.muted">
        It starts at the current moment. Change it if this happened earlier.
      </Text>
      <chakra.input
        id={id}
        type="datetime-local"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        minH="12"
        px="3"
        {...fieldStyles}
      />
    </Box>
  )
}
