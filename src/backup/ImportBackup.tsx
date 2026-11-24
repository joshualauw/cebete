import { Box, Button, chakra, Stack, Text } from '@chakra-ui/react'
import { type ChangeEvent, type ReactElement, useEffect, useRef, useState } from 'react'
import { LuUpload } from 'react-icons/lu'

import { describeCounts, describeRestore, formatBackupDate } from './describe'
import { InvalidBackupError } from './errors'
import { parseBackup } from './parse'
import { restoreBackup } from './restore'
import type { ParsedBackup } from './types'

const FILE_UNREADABLE = 'That file could not be read. Please try another file.'
const RESTORE_FAILED =
  'Your data could not be restored, so nothing was changed. Your current data is still here. Please try again.'

type Step =
  | { readonly name: 'idle' }
  | { readonly name: 'checking' }
  | { readonly name: 'confirming'; readonly backup: ParsedBackup }
  | { readonly name: 'restoring'; readonly backup: ParsedBackup }

type Message = { readonly tone: 'success' | 'problem'; readonly text: string }

/**
 * The Import control. A picked file is checked completely before anything else happens, and the
 * user is shown what it holds and must confirm. Only then is the data on the device replaced.
 */
export default function ImportBackup(): ReactElement {
  const [step, setStep] = useState<Step>({ name: 'idle' })
  const [message, setMessage] = useState<Message | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const importRef = useRef<HTMLButtonElement>(null)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const wasAsking = useRef(false)

  const asking = step.name === 'confirming' || step.name === 'restoring'

  // Focus the safe choice when the question opens, and return to Import when it is closed.
  useEffect(() => {
    if (asking) {
      cancelRef.current?.focus()
    } else if (wasAsking.current) {
      importRef.current?.focus()
    }
    wasAsking.current = asking
  }, [asking])

  async function checkFile(file: File): Promise<void> {
    setStep({ name: 'checking' })
    setMessage(null)

    try {
      const backup = parseBackup(await file.text())

      setStep({ name: 'confirming', backup })
    } catch (error) {
      setStep({ name: 'idle' })

      if (error instanceof InvalidBackupError) {
        setMessage({ tone: 'problem', text: error.message })
      } else {
        console.error('Backup file could not be read', error)
        setMessage({ tone: 'problem', text: FILE_UNREADABLE })
      }
    }
  }

  async function restore(backup: ParsedBackup): Promise<void> {
    setStep({ name: 'restoring', backup })
    setMessage(null)

    try {
      await restoreBackup(backup)
      setStep({ name: 'idle' })
      setMessage({ tone: 'success', text: describeRestore(backup.counts) })
    } catch (error) {
      console.error('Backup could not be restored', error)
      // Nothing changed, so the question stays and the user can try again or cancel.
      setStep({ name: 'confirming', backup })
      setMessage({ tone: 'problem', text: RESTORE_FAILED })
    }
  }

  function handleChoose(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]

    // Forget the choice, so picking the same file again still counts as a change.
    event.target.value = ''

    if (file) {
      void checkFile(file)
    }
  }

  const backup = asking ? step.backup : null
  const contents = backup ? describeCounts(backup.counts) : ''

  return (
    <Stack gap="3">
      <Text color="fg.muted">
        Restore from a backup file. This replaces what is on this device.
      </Text>
      <chakra.input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        aria-label="Choose a backup file"
        hidden
        onChange={handleChoose}
      />
      <Button
        ref={importRef}
        variant="outline"
        size="lg"
        minH="12"
        width="full"
        disabled={step.name !== 'idle'}
        onClick={() => {
          fileRef.current?.click()
        }}
      >
        <LuUpload aria-hidden="true" />
        {step.name === 'checking' ? 'Checking…' : 'Import backup'}
      </Button>

      {backup ? (
        <Box
          role="group"
          aria-label="Replace your data with this backup"
          bg="bg"
          borderWidth="1px"
          borderColor="border.emphasized"
          borderRadius="xl"
          p="4"
        >
          <Stack gap="3">
            <Text fontWeight="semibold">Replace everything on this device?</Text>
            <Text>
              This backup was made on {formatBackupDate(backup.exportedAt)} and holds{' '}
              {contents || 'no entries'}.
            </Text>
            <Text>
              Everything on this device now will be erased and replaced by this backup. This cannot
              be undone. To keep your current data, export it first.
            </Text>
            {/* Stacked, so the long confirm label has room on a narrow phone. Cancel comes first. */}
            <Stack gap="2">
              <Button
                ref={cancelRef}
                variant="outline"
                minH="12"
                disabled={step.name === 'restoring'}
                onClick={() => {
                  setStep({ name: 'idle' })
                  setMessage(null)
                }}
              >
                Cancel
              </Button>
              <Button
                colorPalette="red"
                minH="12"
                disabled={step.name === 'restoring'}
                onClick={() => {
                  void restore(backup)
                }}
              >
                {step.name === 'restoring' ? 'Restoring…' : 'Yes, replace my data'}
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : null}

      {/* Always on the page, so a screen reader announces the text when it appears. */}
      <Text role="status" color="fg.muted">
        {message?.tone === 'success' ? message.text : ''}
      </Text>
      {message?.tone === 'problem' ? (
        <Box role="alert" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
          {message.text}
        </Box>
      ) : null}
    </Stack>
  )
}
