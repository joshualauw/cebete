import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import ExportBackup from './ExportBackup'
import ImportBackup from './ImportBackup'

/** The Backup part of Settings: save a copy of everything on the device, and restore it later. */
export default function BackupSection(): ReactElement {
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
      <Stack gap="6">
        <Stack gap="3">
          <Heading as="h2" id={titleId} size="lg" color="colorPalette.fg">
            Backup
          </Heading>
          <Text color="fg.muted">
            Everything you record stays on this device only. If you clear your browser data or
            change phone, it is gone. A backup saves a copy to a file that you keep.
          </Text>
        </Stack>
        <Stack gap="3">
          <Heading as="h3" size="md">
            Save a copy
          </Heading>
          <ExportBackup />
        </Stack>
        <Stack gap="3">
          <Heading as="h3" size="md">
            Restore from a copy
          </Heading>
          <ImportBackup />
        </Stack>
      </Stack>
    </Box>
  )
}
