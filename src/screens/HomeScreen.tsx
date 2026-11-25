import { Button, chakra, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useId, useRef } from 'react'
import { LuHeart } from 'react-icons/lu'
import { Link } from 'react-router'

import BackupReminder from '@/backup/BackupReminder'
import { paths } from '@/navigation/paths'

const CardLink = chakra(Link)

export default function HomeScreen(): ReactElement {
  const id = useId()
  const titleId = `${id}-title`
  const hintId = `${id}-hint`
  const headingRef = useRef<HTMLHeadingElement>(null)

  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="6">
        <Stack gap="3">
          <Heading
            as="h1"
            ref={headingRef}
            tabIndex={-1}
            size="2xl"
            color="colorPalette.fg"
            outline="none"
          >
            cebete
          </Heading>
          <Text fontSize="lg" color="fg.muted">
            Welcome back. A calm place to notice how you feel, with everything kept on your device.
          </Text>
        </Stack>
        <CardLink
          to={paths.settle}
          aria-labelledby={titleId}
          aria-describedby={hintId}
          display="block"
          minH="12"
          p="5"
          bg="colorPalette.subtle"
          borderWidth="1px"
          borderColor="border"
          borderRadius="xl"
          textDecoration="none"
          _focusVisible={{
            outline: '2px solid',
            outlineColor: 'colorPalette.focusRing',
            outlineOffset: '2px',
          }}
        >
          <Text id={titleId} fontSize="xl" fontWeight="bold" color="colorPalette.fg">
            Need to settle?
          </Text>
          <Text id={hintId} mt="1" color="fg.muted">
            See what can help, a few taps away.
          </Text>
        </CardLink>
        <BackupReminder
          onSnoozed={() => {
            headingRef.current?.focus()
          }}
        />
        <Button asChild variant="outline" size="lg" minH="12" width="full">
          <Link to={paths.coping}>
            <LuHeart aria-hidden="true" />
            My coping library
          </Link>
        </Button>
      </Stack>
    </Container>
  )
}
