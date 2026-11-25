import { Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useState } from 'react'

import EmotionRatings from '@/mood/EmotionRatings'
import type { Emotion } from '@/mood/emotions'
import type { EmotionRating } from '@/mood/types'

import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from './errors'
import { saveThoughtChallenge } from './repository'
import StepFlow, { type FlowStep } from './StepFlow'
import ThoughtLine from './ThoughtLine'
import { BeliefStep, TextStep } from './ThoughtSteps'
import type { ThoughtRecord } from './types'

type ChallengeFlowProps = {
  /** The record being challenged. Its challenge, if it has one, is revised. */
  record: ThoughtRecord
  onDone: () => void
  onSaved?: () => void
}

const SAVE_FAILED = 'Your challenge could not be saved right now. Please try again.'
const NEED_BALANCED = 'Write a more balanced thought to continue.'

/**
 * The guided challenge of a thought: the evidence for and against it, a more balanced thought,
 * and how much it is believed and how things feel now. Nothing is saved before the last step.
 */
export default function ChallengeFlow({
  record,
  onDone,
  onSaved,
}: ChallengeFlowProps): ReactElement {
  const [start] = useState(() => ({
    evidenceFor: record.challenge?.evidenceFor ?? '',
    evidenceAgainst: record.challenge?.evidenceAgainst ?? '',
    balanced: record.challenge?.balanced ?? '',
    belief: record.challenge?.belief ?? record.belief,
    ratings: record.challenge?.emotions ?? record.emotions,
  }))
  const [evidenceFor, setEvidenceFor] = useState(start.evidenceFor)
  const [evidenceAgainst, setEvidenceAgainst] = useState(start.evidenceAgainst)
  const [balanced, setBalanced] = useState(start.balanced)
  const [belief, setBelief] = useState(start.belief)
  const [ratings, setRatings] = useState<readonly EmotionRating[]>(start.ratings)
  const [gone, setGone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const changed =
    evidenceFor !== start.evidenceFor ||
    evidenceAgainst !== start.evidenceAgainst ||
    balanced !== start.balanced ||
    belief !== start.belief ||
    JSON.stringify(ratings) !== JSON.stringify(start.ratings)

  function rate(emotion: Emotion, intensity: number): void {
    setRatings((existing) =>
      existing.map((rating) => (rating.emotion === emotion ? { ...rating, intensity } : rating)),
    )
  }

  async function save(): Promise<void> {
    if (saving) {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      await saveThoughtChallenge(record.id, {
        evidenceFor,
        evidenceAgainst,
        balanced,
        belief,
        emotions: ratings,
      })
      onSaved?.()
      onDone()
    } catch (error) {
      if (error instanceof ThoughtRecordNotFoundError) {
        setGone(true)
        setErrorMessage(error.message)
      } else if (error instanceof InvalidThoughtRecordError) {
        setErrorMessage(error.message)
      } else {
        console.error('Challenge could not be saved', error)
        setErrorMessage(SAVE_FAILED)
      }
      setSaving(false)
    }
  }

  const steps: readonly FlowStep[] = [
    {
      title: 'What speaks for it',
      optional: true,
      empty: evidenceFor.trim() === '',
      content: (
        <TextStep
          label="What speaks for this thought?"
          hint="Facts that make it seem true. You can skip this."
          value={evidenceFor}
          onChange={setEvidenceFor}
        />
      ),
    },
    {
      title: 'What speaks against it',
      optional: true,
      empty: evidenceAgainst.trim() === '',
      content: (
        <TextStep
          label="What speaks against this thought?"
          hint="Facts that do not fit it. You can skip this."
          value={evidenceAgainst}
          onChange={setEvidenceAgainst}
        />
      ),
    },
    {
      title: 'A more balanced thought',
      needs: balanced.trim() === '' ? NEED_BALANCED : null,
      content: (
        <TextStep
          label="What would be a more balanced thought?"
          hint="In your own words, one that takes both sides into account."
          value={balanced}
          onChange={setBalanced}
        />
      ),
    },
    {
      title: 'How much you believe it now',
      content: (
        <BeliefStep
          value={belief}
          onChange={setBelief}
          label="How strongly do you believe the original thought now?"
        />
      ),
    },
    {
      title: 'How you feel now',
      content: (
        <Stack gap="4">
          <Text color="fg.muted">Rate the same feelings again, as they are now.</Text>
          <EmotionRatings ratings={ratings} onChange={rate} />
        </Stack>
      ),
    },
  ]

  return (
    <StepFlow
      label="Challenge this thought"
      eyebrow="Challenge"
      discardTitle="Discard this challenge?"
      steps={steps}
      aboveStep={<ThoughtLine thought={record.thought} />}
      reachedAtStart={record.challenge ? steps.length - 1 : 0}
      changed={changed}
      saving={saving}
      gone={gone}
      errorMessage={errorMessage}
      onSave={() => {
        void save()
      }}
      onClose={onDone}
    />
  )
}
