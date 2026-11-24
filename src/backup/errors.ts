/** Why a file was refused as a backup. Each reason has its own plain-words message. */
export type InvalidBackupReason =
  'not-json' | 'not-backup' | 'newer-version' | 'too-old' | 'damaged'

const MESSAGES: Readonly<Record<InvalidBackupReason, string>> = {
  'not-json': 'This file is not a cebete backup.',
  'not-backup': 'This file is not a cebete backup.',
  'newer-version':
    'This backup was made by a newer version of cebete. Update the app, then try again.',
  'too-old': 'This backup is too old to be read.',
  damaged: 'This backup file looks damaged, so it was not used.',
}

/** Thrown when a file cannot be used as a backup. Nothing on the device is changed. */
export class InvalidBackupError extends Error {
  readonly reason: InvalidBackupReason

  constructor(reason: InvalidBackupReason) {
    super(MESSAGES[reason])
    this.name = 'InvalidBackupError'
    this.reason = reason
  }
}
