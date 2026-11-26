import { Button, Container, Heading, Stack, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuPlus } from 'react-icons/lu'

import CopingForm from '@/coping/CopingForm'
import CopingList from '@/coping/CopingList'

export default function CopingScreen(): ReactElement {
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState(false)
  const [announcement, setAnnouncement] = useState('')
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
        <Stack gap="2">
          <Heading as="h1" size="2xl" color="colorPalette.fg">
            Coping library
          </Heading>
          <Text color="fg.muted">What helps you cope, kept on your device.</Text>
        </Stack>
        <VisuallyHidden role="status">{announcement}</VisuallyHidden>
        {adding ? (
          <CopingForm
            onSaved={() => {
              setAnnouncement('Item saved.')
            }}
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
            disabled={busy}
            onClick={() => {
              setAnnouncement('')
              setAdding(true)
            }}
          >
            <LuPlus aria-hidden="true" />
            Add an item
          </Button>
        )}
        <CopingList locked={adding} onBusyChange={setBusy} />
      </Stack>
    </Container>
  )
}
