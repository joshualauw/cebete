import { useSyncExternalStore } from 'react'

import { type LastBackup, readLastBackup, subscribeBackupPrefs, toLastBackup } from './lastBackup'

/** When the last backup was made, kept up to date as the user makes one. */
export function useLastBackup(): LastBackup {
  return toLastBackup(useSyncExternalStore(subscribeBackupPrefs, readLastBackup))
}
