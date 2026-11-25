/** The four kinds of coping item, in the fixed order their groups are shown. */
export const COPING_TYPES = ['do', 'nearby', 'say', 'about'] as const

export type CopingType = (typeof COPING_TYPES)[number]

/** What each kind is called on screen. */
export const COPING_TYPE_LABELS: Readonly<Record<CopingType, string>> = {
  do: 'Do',
  nearby: 'Keep nearby',
  say: 'Tell myself',
  about: 'About me',
}

/** A short example of each kind, shown in the form once the kind is chosen. */
export const COPING_TYPE_HINTS: Readonly<Record<CopingType, string>> = {
  do: 'Something to do right now, such as slow breathing.',
  nearby: 'Something to reach for, such as a photo or a stuffed animal.',
  say: 'Calming words to say to yourself, such as “This will pass.”',
  about: 'Something true and kind about you, such as “I am a good listener.”',
}

/** The longest short text an item can have. It is a name or a sentence, not a paragraph. */
export const TEXT_MAX_LENGTH = 100

/** The longest detail line an item can have. */
export const DETAIL_MAX_LENGTH = 500

/** What the user writes for an item. */
export type NewCopingItem = {
  readonly type: CopingType
  readonly text: string
  readonly detail?: string
}

/** A saved coping item. Items keep the order they were added, which is the order of their ids. */
export type CopingItem = NewCopingItem & {
  readonly id: number
}
