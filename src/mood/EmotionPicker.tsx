import { chakra, Flex, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'

import { type Emotion, emotionLabel, emotions } from './emotions'
import { MAX_EMOTIONS } from './types'

type EmotionPickerProps = {
  /** The emotions chosen so far, in the order they were chosen. */
  selected: readonly Emotion[]
  /** Called when the user taps an emotion, to choose it or to remove it. */
  onToggle: (emotion: Emotion) => void
}

/**
 * Pick one or more emotions, up to MAX_EMOTIONS. Built on real checkboxes, so it works with a
 * keyboard and with screen readers, and each choice is a comfortably large touch target. Once
 * the limit is reached, the emotions not chosen are switched off until one is removed.
 */
export default function EmotionPicker({ selected, onToggle }: EmotionPickerProps): ReactElement {
  const atLimit = selected.length >= MAX_EMOTIONS

  return (
    <chakra.fieldset border="0" m="0" p="0" minW="0">
      <chakra.legend mb="1" fontWeight="semibold">
        How are you feeling?
      </chakra.legend>
      <Text mb="3" fontSize="sm" color="fg.muted">
        Choose up to {MAX_EMOTIONS}.
      </Text>
      <Flex wrap="wrap" gap="2">
        {emotions.map((emotion) => {
          const chosen = selected.includes(emotion)

          return (
            <chakra.label key={emotion} position="relative" display="inline-flex">
              {/* The real checkbox sits invisibly over its chip, so a tap anywhere on the chip hits it. */}
              <chakra.input
                className="peer"
                type="checkbox"
                name="emotion"
                value={emotion}
                checked={chosen}
                disabled={atLimit && !chosen}
                onChange={() => {
                  onToggle(emotion)
                }}
                position="absolute"
                inset="0"
                m="0"
                width="full"
                height="full"
                opacity="0"
                cursor="pointer"
                _disabled={{ cursor: 'not-allowed' }}
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
                _peerDisabled={{ opacity: 0.45 }}
                _peerFocusVisible={{
                  outline: '2px solid',
                  outlineColor: 'colorPalette.focusRing',
                  outlineOffset: '2px',
                }}
              >
                {emotionLabel(emotion)}
              </chakra.span>
            </chakra.label>
          )
        })}
      </Flex>
      {/* Always on the page, so a screen reader announces the text when it appears. */}
      <Text aria-live="polite" mt="3" fontSize="sm" color="fg.muted">
        {atLimit ? 'That is the most you can choose. Remove one to choose another.' : ''}
      </Text>
    </chakra.fieldset>
  )
}
