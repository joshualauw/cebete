import { Box, Button, Flex, Text } from '@chakra-ui/react'
import { type ReactElement, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router'

import { paths } from '@/navigation/paths'

import { readSnoozedUntil, snoozeBackupReminder, subscribeBackupPrefs } from './lastBackup'
import { isBackupDue, SNOOZE_MS } from './reminder'
import { useHasData } from './useHasData'
import { useLastBackup } from './useLastBackup'

type BackupReminderProps = {
  /** Called after "Not now", so the page can put focus somewhere, since the button goes away. */
  onSnoozed?: () => void
}

/**
 * A gentle, one-line reminder to back up, shown only when it is due. It never blocks anything,
 * and "Not now" puts it off for a while.
 */
export default function BackupReminder({ onSnoozed }: BackupReminderProps): ReactElement | null {
  const lastBackup = useLastBackup()
  const snoozedUntil = useSyncExternalStore(subscribeBackupPrefs, readSnoozedUntil)
  const hasData = useHasData()
  // Taken once, when the reminder first shows, so rendering stays pure. A reminder only needs to
  // be right when the page opens.
  const [now] = useState(() => Date.now())

  // Show nothing until it is known there is data, so the reminder never flashes by mistake.
  if (hasData === undefined || !isBackupDue({ lastBackup, snoozedUntil, hasData, now })) {
    return null
  }

  return (
    <Box
      as="section"
      aria-label="Backup reminder"
      bg="bg.muted"
      borderRadius="xl"
      p="4"
      display="flex"
      flexDirection="column"
      gap="3"
    >
      <Text>
        {lastBackup.status === 'never'
          ? 'You have not made a backup yet. Your entries live only on this device.'
          : 'It has been a while since your last backup.'}
      </Text>
      <Flex gap="2" wrap="wrap">
        <Button asChild minH="12">
          <Link to={paths.settings}>Back up now</Link>
        </Button>
        <Button
          variant="ghost"
          minH="12"
          onClick={() => {
            snoozeBackupReminder(Date.now() + SNOOZE_MS)
            onSnoozed?.()
          }}
        >
          Not now
        </Button>
      </Flex>
    </Box>
  )
}
