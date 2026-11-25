import { Box, Heading, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'

import { STARTER_TECHNIQUES } from './starters'

/** The built-in techniques, each with its steps in plain words. */
export default function StarterTechniques(): ReactElement {
  return (
    <Box as="ul" display="flex" flexDirection="column" gap="3" listStyleType="none" m="0" p="0">
      {STARTER_TECHNIQUES.map((technique) => (
        <Box key={technique.id} as="li" bg="bg.muted" borderRadius="xl" p="4">
          <Heading as="h3" size="md" color="colorPalette.fg">
            {technique.title}
          </Heading>
          <Box as="ol" mt="2" ps="5" display="flex" flexDirection="column" gap="1">
            {technique.steps.map((step) => (
              <Text as="li" key={step} fontSize="lg">
                {step}
              </Text>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
