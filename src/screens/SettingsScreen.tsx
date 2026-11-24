import { Container, Heading, Stack } from '@chakra-ui/react'
import type { ReactElement } from 'react'

import BackupSection from '@/backup/BackupSection'

export default function SettingsScreen(): ReactElement {
  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="6">
        <Heading as="h1" size="2xl" color="colorPalette.fg">
          Settings
        </Heading>
        <BackupSection />
      </Stack>
    </Container>
  )
}
