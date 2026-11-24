/** Thrown when an edit is saved for an entry that is gone, for example because it was deleted. */
export class MoodEntryNotFoundError extends Error {
  constructor() {
    super('This entry no longer exists, so it could not be changed.')
    this.name = 'MoodEntryNotFoundError'
  }
}
