export type InvalidThoughtRecordField =
  | 'record'
  | 'situation'
  | 'emotions'
  | 'action'
  | 'thought'
  | 'belief'
  | 'time'
  | 'evidenceFor'
  | 'evidenceAgainst'
  | 'balanced'

/** Thrown when a thought record breaks a rule. Nothing is saved when this happens. */
export class InvalidThoughtRecordError extends Error {
  readonly field: InvalidThoughtRecordField

  constructor(field: InvalidThoughtRecordField, message: string) {
    super(message)
    this.name = 'InvalidThoughtRecordError'
    this.field = field
  }
}

/** Thrown when an edit is saved for a record that is gone, for example because it was deleted. */
export class ThoughtRecordNotFoundError extends Error {
  constructor() {
    super('This record no longer exists, so it could not be changed.')
    this.name = 'ThoughtRecordNotFoundError'
  }
}
