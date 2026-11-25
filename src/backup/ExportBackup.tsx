import { Box, Button, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useState } from 'react'
import { LuDownload } from 'react-icons/lu'

import { describeExport } from './describe'
import { backupFileName, downloadTextFile } from './download'
import { createBackup, serializeBackup } from './export'
import { recordBackup } from './lastBackup'

const EXPORT_FAILED = 'Your backup could not be created right now. Please try again.'

/** The Export control: makes a backup of everything stored and downloads it as one file. */
export default function ExportBackup(): ReactElement {
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState('')
  const [failed, setFailed] = useState(false)

  async function exportBackup(): Promise<void> {
    setBusy(true)
    setFailed(false)
    setSaved('')

    try {
      const result = await createBackup()

      downloadTextFile(backupFileName(new Date()), serializeBackup(result))
      recordBackup()
      setSaved(describeExport(result.counts, result.skipped))
    } catch (error) {
      console.error('Backup could not be created', error)
      setFailed(true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack gap="3">
      <Button
        size="lg"
        minH="12"
        width="full"
        disabled={busy}
        onClick={() => {
          void exportBackup()
        }}
      >
        <LuDownload aria-hidden="true" />
        {busy ? 'Exporting…' : 'Export backup'}
      </Button>
      {/* Always on the page, so a screen reader announces the text when it appears. */}
      <Text role="status" color="fg.muted">
        {saved}
      </Text>
      {failed ? (
        <Box role="alert" bg="bg.error" color="fg.error" borderRadius="lg" p="3">
          {EXPORT_FAILED}
        </Box>
      ) : null}
    </Stack>
  )
}
