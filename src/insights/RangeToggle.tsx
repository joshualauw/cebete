import { chakra, Flex, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import { RANGE_DAYS, type RangeDays } from './range'

type RangeToggleProps = {
  value: RangeDays
  onChange: (days: RangeDays) => void
}

/**
 * Choose how far back the summary looks. Built on real radio buttons, so it works with a
 * keyboard and with screen readers, and each choice is a comfortably large touch target.
 */
export default function RangeToggle({ value, onChange }: RangeToggleProps): ReactElement {
  const name = useId()

  return (
    <chakra.fieldset border="0" m="0" p="0" minW="0">
      <VisuallyHidden asChild>
        <legend>Time range</legend>
      </VisuallyHidden>
      <Flex gap="2">
        {RANGE_DAYS.map((days) => (
          <chakra.label key={days} position="relative" display="inline-flex">
            {/* The real radio button sits invisibly over its chip, so a tap anywhere on it hits it. */}
            <chakra.input
              className="peer"
              type="radio"
              name={name}
              value={days}
              checked={value === days}
              onChange={() => {
                onChange(days)
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
              {days} days
            </chakra.span>
          </chakra.label>
        ))}
      </Flex>
    </chakra.fieldset>
  )
}
