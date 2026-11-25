import { chakra } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

export type StepMarkerState = {
  readonly title: string
  readonly finished: boolean
  /** What is needed before this step can be reached, or null when it can be reached. */
  readonly blockedBy: string | null
}

type StepMarkersProps = {
  markers: readonly StepMarkerState[]
  current: number
  onSelect: (index: number) => void
}

/**
 * A row of numbered step markers for jumping between the steps of a flow. A step that cannot be
 * reached yet is marked as disabled but stays focusable, so assistive technology can still read
 * what is needed first.
 */
export default function StepMarkers({
  markers,
  current,
  onSelect,
}: StepMarkersProps): ReactElement {
  const id = useId()

  return (
    <chakra.ol
      aria-label="Steps"
      display="flex"
      listStyleType="none"
      marginBlock="0"
      marginInline="-3"
      p="0"
    >
      {markers.map(({ title, finished, blockedBy }, index) => {
        const isCurrent = index === current
        const hintId = `${id}-${String(index)}`

        return (
          <chakra.li key={title} flex="1" display="flex" justifyContent="center">
            <chakra.button
              type="button"
              aria-label={`Step ${String(index + 1)}: ${title}`}
              aria-current={isCurrent ? 'step' : undefined}
              aria-disabled={blockedBy !== null ? true : undefined}
              aria-describedby={blockedBy !== null ? hintId : undefined}
              data-finished={finished ? '' : undefined}
              onClick={() => {
                if (blockedBy === null) {
                  onSelect(index)
                }
              }}
              display="flex"
              alignItems="center"
              justifyContent="center"
              width="full"
              minW="12"
              minH="12"
              bg="transparent"
              cursor={blockedBy !== null ? 'not-allowed' : 'pointer'}
              _focusVisible={{
                outline: '2px solid',
                outlineColor: 'colorPalette.focusRing',
                outlineOffset: '-2px',
                borderRadius: 'full',
              }}
            >
              <chakra.span
                aria-hidden="true"
                display="inline-flex"
                alignItems="center"
                justifyContent="center"
                boxSize="9"
                borderRadius="full"
                borderWidth="1px"
                fontWeight={isCurrent ? 'bold' : 'medium'}
                opacity={blockedBy !== null ? 0.45 : 1}
                {...(isCurrent
                  ? {
                      bg: 'colorPalette.solid',
                      color: 'colorPalette.contrast',
                      borderColor: 'colorPalette.solid',
                    }
                  : finished
                    ? {
                        bg: 'colorPalette.subtle',
                        color: 'colorPalette.fg',
                        borderColor: 'colorPalette.solid',
                      }
                    : { bg: 'bg', color: 'fg.muted', borderColor: 'border.emphasized' })}
              >
                {index + 1}
              </chakra.span>
            </chakra.button>
            {blockedBy !== null ? (
              <chakra.span id={hintId} hidden>
                {blockedBy}
              </chakra.span>
            ) : null}
          </chakra.li>
        )
      })}
    </chakra.ol>
  )
}
