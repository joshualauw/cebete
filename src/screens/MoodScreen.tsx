import { Button, Container, Heading, Stack } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuPlus } from 'react-icons/lu'

import MoodForm from '@/mood/MoodForm'
import MoodList from '@/mood/MoodList'

export default function MoodScreen(): ReactElement {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasAdding = useRef(false)

  // When the form closes, give focus back to the button that opened it.
  useEffect(() => {
    if (wasAdding.current && !adding) {
      addButtonRef.current?.focus()
    }
    wasAdding.current = adding
  }, [adding])

  return (
    <Container maxW="lg" px="6" py="10">
      <Stack gap="6">
        <Heading as="h1" size="2xl" color="colorPalette.fg">
          Mood
        </Heading>
        {adding ? (
          <MoodForm
            onDone={() => {
              setAdding(false)
            }}
          />
        ) : (
          <Button
            ref={addButtonRef}
            size="lg"
            minH="12"
            width="full"
            disabled={editing}
            onClick={() => {
              setAdding(true)
            }}
          >
            <LuPlus aria-hidden="true" />
            Add entry
          </Button>
        )}
        <MoodList locked={adding} onEditingChange={setEditing} />
      </Stack>
    </Container>
  )
}
