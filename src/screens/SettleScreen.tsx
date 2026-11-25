import { Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'
import { LuArrowLeft } from 'react-icons/lu'
import { Link } from 'react-router'

import SettleGroups from '@/coping/SettleGroups'
import { useCopingItems } from '@/coping/useCopingItems'
import { paths } from '@/navigation/paths'

export default function SettleScreen(): ReactElement {
  const state = useCopingItems()
  // Only once the items have loaded, so a user who has some never sees the prompt flash by.
  const libraryEmpty = state.status === 'ready' && state.items.length === 0

  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="6">
        <Button asChild variant="ghost" minH="12" alignSelf="flex-start">
          <Link to={paths.home}>
            <LuArrowLeft aria-hidden="true" />
            Back to home
          </Link>
        </Button>
        <Stack gap="2">
          <Heading as="h1" size="2xl" color="colorPalette.fg">
            Need to settle?
          </Heading>
          <Text fontSize="lg" color="fg.muted">
            You do not have to do all of it. Pick one thing and take it slowly.
          </Text>
        </Stack>
        <SettleGroups state={state} />
        {libraryEmpty ? (
          <Text color="fg.muted">
            Add the things that help you in your own coping library, so they are here when you need
            them.
          </Text>
        ) : null}
        <Button asChild variant="outline" size="lg" minH="12" width="full">
          <Link to={paths.coping}>Edit my coping library</Link>
        </Button>
        <Text fontSize="sm" color="fg.muted">
          cebete is a self-help tool. It is not a substitute for professional care or emergency
          help.
        </Text>
      </Stack>
    </Container>
  )
}
