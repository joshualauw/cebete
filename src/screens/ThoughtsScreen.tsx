import { Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { useLocation, useNavigate } from 'react-router'

import { wantsOpenForm } from '@/navigation/openForm'
import ThoughtRecordFlow from '@/thoughts/ThoughtRecordFlow'
import ThoughtRecordList from '@/thoughts/ThoughtRecordList'

export default function ThoughtsScreen(): ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  // Read once, when the screen appears: a quick action on Home asks for the capture to be open.
  const [requested] = useState(() => wantsOpenForm(location.state))
  const [adding, setAdding] = useState(requested)
  const newButtonRef = useRef<HTMLButtonElement>(null)
  const wasAdding = useRef(false)

  // The request is used once. It is cleared only when it was there, so the notes the list keeps
  // in the same history entry are left alone.
  useEffect(() => {
    if (requested) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [requested, navigate, location.pathname])

  useEffect(() => {
    if (wasAdding.current && !adding) {
      newButtonRef.current?.focus()
    }
    wasAdding.current = adding
  }, [adding])

  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="6">
        <Stack gap="2">
          <Heading as="h1" size="2xl" color="colorPalette.fg">
            Thoughts
          </Heading>
          <Text color="fg.muted">
            A self-help tracker for noticing your thoughts. It is not a substitute for professional
            care.
          </Text>
        </Stack>
        {adding ? (
          <ThoughtRecordFlow
            onDone={() => {
              setAdding(false)
            }}
          />
        ) : (
          <Button
            ref={newButtonRef}
            size="lg"
            minH="12"
            width="full"
            onClick={() => {
              setAdding(true)
            }}
          >
            <LuPlus aria-hidden="true" />
            New thought record
          </Button>
        )}
        <ThoughtRecordList locked={adding} />
      </Stack>
    </Container>
  )
}
