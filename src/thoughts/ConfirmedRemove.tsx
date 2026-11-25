import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'
import { LuTrash2 } from 'react-icons/lu'

type ConfirmedRemoveProps = {
  /** The control that asks the question, for example "Delete this record". */
  buttonLabel: string
  /** The name of the question for assistive technology. */
  groupLabel: string
  question: string
  confirmLabel: string
  /** Shown on the confirm button while the removal is under way. */
  progressLabel: string
  failedMessage: string
  /** What is reported to the console when the removal fails. */
  logMessage: string
  remove: () => Promise<void>
  /** Whether the question is open. The parent decides, so only one flow is open at a time. */
  asking: boolean
  /** Switches the control off, for example while another flow is open. */
  locked: boolean
  onAsk: () => void
  onKeep: () => void
  onRemoved: () => void
}

/**
 * Removing something behind a question, since it cannot be undone. Keep is focused first, a
 * failure shows a calm message and allows a retry, and focus returns to the control on Keep.
 */
export default function ConfirmedRemove({
  buttonLabel,
  groupLabel,
  question,
  confirmLabel,
  progressLabel,
  failedMessage,
  logMessage,
  remove,
  asking,
  locked,
  onAsk,
  onKeep,
  onRemoved,
}: ConfirmedRemoveProps): ReactElement {
  const [removing, setRemoving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const keepRef = useRef<HTMLButtonElement>(null)
  const askRef = useRef<HTMLButtonElement>(null)
  const wasAsking = useRef(false)
  // After a removal, whoever handles it decides where focus goes: this control is about to go,
  // or has nothing left to ask about, so it must not pull focus back to itself.
  const justRemoved = useRef(false)

  useEffect(() => {
    if (asking) {
      justRemoved.current = false
      keepRef.current?.focus()
    } else if (wasAsking.current && !justRemoved.current) {
      askRef.current?.focus()
    }
    wasAsking.current = asking
  }, [asking])

  async function confirm(): Promise<void> {
    setRemoving(true)
    setErrorMessage(null)

    try {
      await remove()
      justRemoved.current = true
      setRemoving(false)
      onRemoved()
    } catch (error) {
      console.error(logMessage, error)
      setErrorMessage(failedMessage)
      setRemoving(false)
    }
  }

  if (!asking) {
    return (
      <Flex justify="flex-end">
        <Button
          ref={askRef}
          variant="ghost"
          minH="12"
          disabled={locked}
          onClick={() => {
            setErrorMessage(null)
            onAsk()
          }}
        >
          <LuTrash2 aria-hidden="true" />
          {buttonLabel}
        </Button>
      </Flex>
    )
  }

  return (
    <Box role="group" aria-label={groupLabel}>
      <Text fontWeight="semibold">{question}</Text>
      {errorMessage ? (
        <Box role="alert" mt="2" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
          {errorMessage}
        </Box>
      ) : null}
      <Flex mt="3" gap="2">
        <Button
          ref={keepRef}
          variant="outline"
          minH="12"
          flex="1"
          disabled={removing}
          onClick={() => {
            setErrorMessage(null)
            onKeep()
          }}
        >
          Keep
        </Button>
        <Button
          colorPalette="red"
          minH="12"
          flex="1"
          disabled={removing}
          onClick={() => {
            void confirm()
          }}
        >
          {removing ? progressLabel : confirmLabel}
        </Button>
      </Flex>
    </Box>
  )
}
