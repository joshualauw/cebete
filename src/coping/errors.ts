/** Thrown when an edit is saved for an item that is gone, for example because it was deleted. */
export class CopingItemNotFoundError extends Error {
  constructor() {
    super('This item no longer exists, so it could not be changed.')
    this.name = 'CopingItemNotFoundError'
  }
}
