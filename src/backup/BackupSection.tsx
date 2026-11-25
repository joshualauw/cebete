import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import { formatLastBackupDate } from './describe'
import ExportBackup from './ExportBackup'
import ImportBackup from './ImportBackup'
import type { LastBackup } from './lastBackup'
import { useLastBackup } from './useLastBackup'

function describeLastBackup(lastBackup: LastBackup): string {
  switch (lastBackup.status) {
    case 'never':
      return 'Never backed up'
    case 'unknown':
      return 'Last backup: unknown'
    case 'made':
      return `Last backup: ${formatLastBackupDate(lastBackup.at)}`
  }
}

/** The Backup part of Settings: save a copy of everything on the device, and restore it later. */
export default function BackupSection(): ReactElement {
  const titleId = useId()
  const lastBackup = useLastBackup()

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
          <Text fontWeight="semibold">{describeLastBackup(lastBackup)}</Text>
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
