import { Button, Container, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuPlus } from 'react-icons/lu'

import ThoughtRecordFlow from '@/thoughts/ThoughtRecordFlow'
import ThoughtRecordList from '@/thoughts/ThoughtRecordList'

export default function ThoughtsScreen(): ReactElement {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const newButtonRef = useRef<HTMLButtonElement>(null)
  const wasAdding = useRef(false)

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
            disabled={editing}
            onClick={() => {
              setAdding(true)
            }}
          >
            <LuPlus aria-hidden="true" />
            New thought record
          </Button>
        )}
        <ThoughtRecordList locked={adding} onEditingChange={setEditing} />
      </Stack>
    </Container>
  )
}
