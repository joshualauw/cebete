import { Container, Heading, Stack, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'

type ComingSoonProps = {
  title: string
  message: string
}

/** Placeholder for a section whose own ticket has not been delivered yet. */
export default function ComingSoon({ title, message }: ComingSoonProps): ReactElement {
  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="3">
        <Heading as="h1" size="2xl" color="colorPalette.fg">
          {title}
        </Heading>
        <Text fontSize="lg" color="fg.muted">
          Coming soon. {message}
        </Text>
      </Stack>
    </Container>
  )
}
