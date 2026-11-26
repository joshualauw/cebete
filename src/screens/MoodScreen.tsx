import { Button, Container, Heading, Stack } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuPlus } from 'react-icons/lu'
import { useLocation, useNavigate } from 'react-router'

import MoodForm from '@/mood/MoodForm'
import MoodList from '@/mood/MoodList'
import { wantsOpenForm } from '@/navigation/openForm'

export default function MoodScreen(): ReactElement {
  const location = useLocation()
  const navigate = useNavigate()
  // Read once, when the screen appears: a quick action on Home asks for the form to be open.
  const [requested] = useState(() => wantsOpenForm(location.state))
  const [adding, setAdding] = useState(requested)
  const [editing, setEditing] = useState(false)
  const addButtonRef = useRef<HTMLButtonElement>(null)
  const wasAdding = useRef(false)

  // The request is used once. Clearing it, by replacing the history entry, means that a reload
  // does not open the form again, and Back still goes to where the user came from.
  useEffect(() => {
    if (requested) {
      void navigate(location.pathname, { replace: true, state: null })
    }
  }, [requested, navigate, location.pathname])

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
