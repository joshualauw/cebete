/** The address of each section. The current section is part of the address. */
export const paths = {
  home: '/',
  mood: '/mood',
  thoughts: '/thoughts',
  /** One thought record, opened from the Thoughts list. */
  thoughtRecord: '/thoughts/:id',
  /** The coping library, entered from Home. It has no bar item of its own. */
  coping: '/coping',
  /** The quick "settle now" screen, entered from Home. It has no bar item of its own. */
  settle: '/settle',
  settings: '/settings',
} as const

export function thoughtRecordPath(id: number): string {
  return `${paths.thoughts}/${String(id)}`
}
