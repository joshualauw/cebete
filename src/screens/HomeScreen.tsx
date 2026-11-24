import { Container, Heading, Stack, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'

export default function HomeScreen(): ReactElement {
  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="3">
        <Heading as="h1" size="2xl" color="colorPalette.fg">
          cebete
        </Heading>
        <Text fontSize="lg" color="fg.muted">
          Welcome back. A calm place to notice how you feel, with everything kept on your device.
        </Text>
      </Stack>
    </Container>
  )
}
