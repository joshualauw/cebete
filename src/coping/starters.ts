/** A technique that comes with the app. It is fixed: it is not stored, edited or backed up. */
export type StarterTechnique = {
  readonly id: string
  readonly title: string
  readonly steps: readonly string[]
}

export const STARTER_TECHNIQUES: readonly StarterTechnique[] = [
  {
    id: 'slow-breathing',
    title: 'Slow breathing',
    steps: [
      'Sit or stand somewhere comfortable and let your shoulders drop.',
      'Breathe in slowly through your nose while you count to four.',
      'Breathe out slowly through your mouth while you count to six.',
      'Keep going for about a minute, or until you feel a little steadier.',
    ],
  },
  {
    id: 'grounding',
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
    id: 'muscle-relaxation',
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
