import { type ReactElement, useState } from 'react'

import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from './errors'
import { saveThoughtTest } from './repository'
import StepFlow, { type FlowStep } from './StepFlow'
import ThoughtLine from './ThoughtLine'
import { TextStep } from './ThoughtSteps'
import type { ThoughtRecord, ThoughtTest } from './types'

type PlanTestFlowProps = {
  /** The record to test. Its test, if it has one, is revised. */
  record: ThoughtRecord
  onDone: () => void
  onSaved?: () => void
}

const SAVE_FAILED = 'Your plan could not be saved right now. Please try again.'
const NEED_PLAN = 'Write how and when you could test it to continue.'
const NEED_PREDICTION = 'Write your prediction to continue.'

/**
 * The guided plan of a real-life test of a thought: how and when to test it, and what the user
 * predicts. Nothing is saved before the last step. A test whose result is already logged keeps
 * its result when its plan is revised.
 */
export default function PlanTestFlow({ record, onDone, onSaved }: PlanTestFlowProps): ReactElement {
  const existing = record.test
  const [start] = useState(() => ({
    plan: existing?.plan ?? '',
    prediction: existing?.prediction ?? '',
  }))
  const [plan, setPlan] = useState(start.plan)
  const [prediction, setPrediction] = useState(start.prediction)
  const [gone, setGone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const changed = plan !== start.plan || prediction !== start.prediction

  async function save(): Promise<void> {
    if (saving) {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const test: ThoughtTest =
        existing?.status === 'done'
          ? { ...existing, plan, prediction }
          : { status: 'planned', plan, prediction }

      await saveThoughtTest(record.id, test)
      onSaved?.()
      onDone()
    } catch (error) {
      if (error instanceof ThoughtRecordNotFoundError) {
        setGone(true)
        setErrorMessage(error.message)
      } else if (error instanceof InvalidThoughtRecordError) {
        setErrorMessage(error.message)
      } else {
        console.error('Test plan could not be saved', error)
        setErrorMessage(SAVE_FAILED)
      }
      setSaving(false)
    }
  }

  const steps: readonly FlowStep[] = [
    {
      title: 'How and when',
      needs: plan.trim() === '' ? NEED_PLAN : null,
      content: (
        <TextStep
          label="How and when could you test this thought?"
          hint="Something small you can really do, and when you will do it."
          value={plan}
          onChange={setPlan}
        />
      ),
    },
    {
      title: 'Your prediction',
      needs: prediction.trim() === '' ? NEED_PREDICTION : null,
      content: (
        <TextStep
          label="If the thought were true, what do you predict would happen?"
          hint="Write it down before you test it, so you can compare."
          value={prediction}
          onChange={setPrediction}
        />
      ),
    },
  ]

  return (
    <StepFlow
      label="Plan a test"
      eyebrow="Plan a test"
      discardTitle="Discard this plan?"
      steps={steps}
      aboveStep={<ThoughtLine thought={record.thought} />}
      reachedAtStart={existing ? steps.length - 1 : 0}
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
