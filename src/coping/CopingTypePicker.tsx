import { chakra, Flex, Text } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import { COPING_TYPE_HINTS, COPING_TYPE_LABELS, COPING_TYPES, type CopingType } from './types'

type CopingTypePickerProps = {
  /** The chosen kind, or `null` while none is chosen yet. */
  selected: CopingType | null
  onChange: (type: CopingType) => void
}

/**
 * Choose what kind of item this is. Built on real radio buttons, so it works with a keyboard and
 * with screen readers, and each choice is a comfortably large touch target.
 */
export default function CopingTypePicker({
  selected,
  onChange,
}: CopingTypePickerProps): ReactElement {
  const name = useId()

  return (
    <chakra.fieldset border="0" m="0" p="0" minW="0">
      <chakra.legend mb="3" fontWeight="semibold">
        What kind of item is it?
      </chakra.legend>
      <Flex wrap="wrap" gap="2">
        {COPING_TYPES.map((type) => (
          <chakra.label key={type} position="relative" display="inline-flex">
            {/* The real radio button sits invisibly over its chip, so a tap anywhere on it hits it. */}
            <chakra.input
              className="peer"
              type="radio"
              name={name}
              value={type}
              checked={selected === type}
              onChange={() => {
                onChange(type)
              }}
              position="absolute"
              inset="0"
              m="0"
              width="full"
              height="full"
              opacity="0"
              cursor="pointer"
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
              _peerFocusVisible={{
                outline: '2px solid',
                outlineColor: 'colorPalette.focusRing',
                outlineOffset: '2px',
              }}
            >
              {COPING_TYPE_LABELS[type]}
            </chakra.span>
          </chakra.label>
        ))}
      </Flex>
      <Text mt="3" fontSize="sm" color="fg.muted" aria-live="polite">
        {selected === null ? '' : COPING_TYPE_HINTS[selected]}
      </Text>
    </chakra.fieldset>
  )
}
