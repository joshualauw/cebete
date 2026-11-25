/** The places in the body a reaction can be noted, in the order they are always shown and stored. */
export const BODY_AREAS = [
  'head',
  'throat-neck',
  'chest',
  'stomach',
  'hands',
  'legs',
  'whole-body',
] as const

export type BodyArea = (typeof BODY_AREAS)[number]

const LABELS: Readonly<Record<BodyArea, string>> = {
  head: 'Head',
  'throat-neck': 'Throat and neck',
  chest: 'Chest',
  stomach: 'Stomach',
  hands: 'Hands',
  legs: 'Legs',
  'whole-body': 'Whole body',
}

export function bodyAreaLabel(area: BodyArea): string {
  return LABELS[area]
}

export function isBodyArea(value: unknown): value is BodyArea {
  return BODY_AREAS.some((area) => area === value)
}

/** One place in the body where a reaction is felt, with an optional word or two about it. */
export type BodyNote = {
  readonly area: BodyArea
  readonly description?: string
}
