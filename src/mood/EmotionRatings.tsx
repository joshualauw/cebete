import { Box, chakra, Flex, Stack, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import { type Emotion, emotionLabel } from './emotions'
import { type EmotionRating, INTENSITY_MAX, INTENSITY_MIN } from './types'

type EmotionRatingsProps = {
  /** The chosen emotions with their ratings, in the order they were chosen. */
  ratings: readonly EmotionRating[]
  onChange: (emotion: Emotion, intensity: number) => void
}

/** One 0 to 10 slider for each chosen emotion, so every feeling gets its own rating. */
export default function EmotionRatings({
  ratings,
  onChange,
}: EmotionRatingsProps): ReactElement | null {
  const id = useId()

  if (ratings.length === 0) {
    return null
  }

  return (
    <chakra.fieldset border="0" m="0" p="0" minW="0">
      <chakra.legend mb="3" fontWeight="semibold">
        How strong is each feeling?
      </chakra.legend>
      <Stack gap="5">
        {ratings.map(({ emotion, intensity }) => {
          const sliderId = `${id}-${emotion}`

          return (
            <Box key={emotion}>
              <Flex justify="space-between" align="baseline" mb="2">
                <chakra.label htmlFor={sliderId} fontWeight="medium">
                  {emotionLabel(emotion)}
                  <VisuallyHidden> intensity</VisuallyHidden>
                </chakra.label>
                <chakra.output htmlFor={sliderId} fontWeight="bold" color="colorPalette.fg">
                  {intensity}/{INTENSITY_MAX}
                </chakra.output>
              </Flex>
              <chakra.input
                id={sliderId}
                type="range"
                min={INTENSITY_MIN}
                max={INTENSITY_MAX}
                step={1}
                value={intensity}
                onChange={(event) => {
                  onChange(emotion, Number(event.target.value))
                }}
                aria-valuetext={`${String(intensity)} out of ${String(INTENSITY_MAX)}`}
                width="full"
                height="12"
                accentColor="colorPalette.solid"
              />
            </Box>
          )
        })}
      </Stack>
    </chakra.fieldset>
  )
}
