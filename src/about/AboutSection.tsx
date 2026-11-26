import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import { APP_VERSION } from './version'

/** The About part of Settings: what cebete is, what it does with your data, and what it is not. */
export default function AboutSection(): ReactElement {
  const titleId = useId()

  return (
    <Box
      as="section"
      aria-labelledby={titleId}
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
    >
      <Stack gap="4">
        <Stack gap="1">
          <Heading as="h2" id={titleId} size="lg" color="colorPalette.fg">
            About
          </Heading>
          <Text fontWeight="semibold">cebete, version {APP_VERSION}</Text>
        </Stack>
        <Stack gap="2">
          <Heading as="h3" size="md">
            Your privacy
          </Heading>
          <Text color="fg.muted">
            Everything you record stays on this device. cebete sends nothing anywhere and has no
            analytics. Backup files are plain text, so keep them safe.
          </Text>
        </Stack>
        <Stack gap="2">
          <Heading as="h3" size="md">
            What cebete is not
          </Heading>
          <Text color="fg.muted">
            cebete is a self-help tool. It is not a substitute for professional care or emergency
            help.
          </Text>
        </Stack>
      </Stack>
    </Box>
  )
}
