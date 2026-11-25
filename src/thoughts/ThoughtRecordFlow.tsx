import { Stack } from '@chakra-ui/react'
import { type ReactElement, useState } from 'react'

import EmotionPicker from '@/mood/EmotionPicker'
import EmotionRatings from '@/mood/EmotionRatings'
import type { Emotion } from '@/mood/emotions'
import { fromDateTimeFieldValue, toDateTimeFieldValue } from '@/mood/format'
import { type EmotionRating, INTENSITY_DEFAULT, MAX_EMOTIONS } from '@/mood/types'

import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from './errors'
import { addThoughtRecord, updateThoughtRecord } from './repository'
import StepFlow, { type FlowStep } from './StepFlow'
import { BeliefStep, TextStep, TimeStep } from './ThoughtSteps'
import { BELIEF_DEFAULT, type ThoughtRecord } from './types'

type ThoughtRecordFlowProps = {
  onDone: () => void
  onSaved?: () => void
  /** The record to change. Without it the flow adds a new record. */
  record?: ThoughtRecord
}

const SAVE_FAILED = 'Your record could not be saved right now. Please try again.'
const NEED_FEELINGS = 'Choose how you felt to continue.'
const NEED_THOUGHT = 'Write your thought to continue.'

/**
 * The guided capture of a thought record. Given a record it edits that record instead, starting
 * from its values. Nothing is saved before the last step.
 */
export default function ThoughtRecordFlow({
  onDone,
  onSaved,
  record,
}: ThoughtRecordFlowProps): ReactElement {
  const [start] = useState(() => ({
    situation: record?.situation ?? '',
    ratings: record?.emotions ?? [],
    action: record?.action ?? '',
    thought: record?.thought ?? '',
    belief: record?.belief ?? BELIEF_DEFAULT,
    time: toDateTimeFieldValue(record?.createdAt ?? Date.now()),
  }))
  const [situation, setSituation] = useState(start.situation)
  const [ratings, setRatings] = useState<readonly EmotionRating[]>(start.ratings)
  const [action, setAction] = useState(start.action)
  const [thought, setThought] = useState(start.thought)
  const [belief, setBelief] = useState(start.belief)
  const [time, setTime] = useState(start.time)
  const [gone, setGone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const changed =
    situation !== start.situation ||
    JSON.stringify(ratings) !== JSON.stringify(start.ratings) ||
    action !== start.action ||
    thought !== start.thought ||
    belief !== start.belief ||
    time !== start.time

  function toggleEmotion(emotion: Emotion): void {
    setRatings((existing) => {
      if (existing.some((rating) => rating.emotion === emotion)) {
        return existing.filter((rating) => rating.emotion !== emotion)
      }

      if (existing.length >= MAX_EMOTIONS) {
        return existing
      }

      return [...existing, { emotion, intensity: INTENSITY_DEFAULT }]
    })
  }

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
      const chosen = time === start.time ? undefined : fromDateTimeFieldValue(time)
      const answers = { situation, emotions: ratings, action, thought, belief }

      if (record) {
        await updateThoughtRecord(record.id, {
          ...answers,
          createdAt: chosen ?? record.createdAt,
        })
      } else {
        await addThoughtRecord({ ...answers, ...(chosen !== undefined && { createdAt: chosen }) })
      }
      onSaved?.()
      onDone()
    } catch (error) {
      if (error instanceof ThoughtRecordNotFoundError) {
        setGone(true)
        setErrorMessage(error.message)
      } else if (error instanceof InvalidThoughtRecordError) {
        setErrorMessage(error.message)
      } else {
        console.error('Thought record could not be saved', error)
        setErrorMessage(SAVE_FAILED)
      }
      setSaving(false)
    }
  }

  const steps: readonly FlowStep[] = [
    {
      title: 'The situation',
      optional: true,
      empty: situation.trim() === '',
      content: (
        <TextStep
          label="What was happening?"
          hint="A sentence or two is enough. You can skip this."
          value={situation}
          onChange={setSituation}
        />
      ),
    },
    {
      title: 'Your feelings',
      needs: ratings.length === 0 ? NEED_FEELINGS : null,
      content: (
        <Stack gap="6">
          <EmotionPicker
            selected={ratings.map(({ emotion }) => emotion)}
            onToggle={toggleEmotion}
          />
          <EmotionRatings ratings={ratings} onChange={rate} />
        </Stack>
      ),
    },
    {
      title: 'What you did',
      optional: true,
      empty: action.trim() === '',
      content: (
        <TextStep
          label="What did you do?"
          hint="How did you react, or what did you avoid? You can skip this."
          value={action}
          onChange={setAction}
        />
      ),
    },
    {
      title: 'Your thought',
      needs: thought.trim() === '' ? NEED_THOUGHT : null,
      content: (
        <TextStep
          label="What went through your mind?"
          hint="Write the thought as it came, in your own words."
          value={thought}
          onChange={setThought}
        />
      ),
    },
    {
      title: 'How much you believe it',
      content: <BeliefStep value={belief} onChange={setBelief} />,
    },
    { title: 'When it happened', content: <TimeStep value={time} onChange={setTime} /> },
  ]

  return (
    <StepFlow
      label={record ? 'Edit thought record' : 'New thought record'}
      eyebrow={record ? 'Edit record' : 'New record'}
      discardTitle="Discard this record?"
      steps={steps}
      reachedAtStart={record ? steps.length - 1 : 0}
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
