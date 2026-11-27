import { Box, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'

type ThoughtLineProps = {
  thought: string
}

/** Reminds the user what a flow is about: the thought, in full. */
export default function ThoughtLine({ thought }: ThoughtLineProps): ReactElement {
  return (
    <Box bg="bg.subtle" borderRadius="lg" p="3">
      <Text fontWeight="semibold" color="colorPalette.fg" overflowWrap="anywhere">
        {thought}
      </Text>
    </Box>
  )
}
