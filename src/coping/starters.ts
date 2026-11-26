import type { NewCopingItem } from './types'

/**
 * A technique every new library starts with. This is only the source of the first three items:
 * once they are added, they are ordinary library items that the user can edit or delete.
 */
type StarterTechnique = {
  readonly title: string
  readonly steps: readonly string[]
}

export const STARTER_TECHNIQUES: readonly StarterTechnique[] = [
  {
    title: 'Slow breathing',
    steps: [
      'Sit or stand somewhere comfortable and let your shoulders drop.',
      'Breathe in slowly through your nose while you count to four.',
      'Breathe out slowly through your mouth while you count to six.',
      'Keep going for about a minute, or until you feel a little steadier.',
    ],
  },
  {
    title: 'Grounding: 5, 4, 3, 2, 1',
    steps: [
      'Look around and name five things you can see.',
      'Notice four things you can feel, such as your feet on the floor.',
      'Listen for three things you can hear.',
      'Name two things you can smell, or two smells you like.',
      'Finish with one slow breath.',
    ],
  },
  {
    title: 'Muscle relaxation',
    steps: [
      'Squeeze both fists tight, count to five, then let go.',
      'Lift your shoulders towards your ears, hold for five, then drop them.',
      'Scrunch up your face, hold for five, then soften it.',
      'Press your feet into the floor, hold for five, then release.',
      'Notice how your body feels now.',
    ],
  },
]

/**
 * The items a new library starts with, in this order: "Do" items, each with the technique's name
 * as its text and its steps, numbered, one to a line as its detail.
 */
export function starterItems(): readonly NewCopingItem[] {
  return STARTER_TECHNIQUES.map(({ title, steps }) => ({
    type: 'do',
    text: title,
    detail: steps.map((step, index) => `${String(index + 1)}. ${step}`).join('\n'),
  }))
}
