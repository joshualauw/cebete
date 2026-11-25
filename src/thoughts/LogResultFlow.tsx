import { type ReactElement, useState } from 'react'

import { InvalidThoughtRecordError, ThoughtRecordNotFoundError } from './errors'
import { saveThoughtTest } from './repository'
import StepFlow, { type FlowStep } from './StepFlow'
import ThoughtLine from './ThoughtLine'
import { BeliefStep, TextStep } from './ThoughtSteps'
import type { ThoughtRecord, ThoughtTest } from './types'

type LogResultFlowProps = {
  record: ThoughtRecord
  /** The planned or done test whose result is logged. A done test is revised. */
  test: ThoughtTest
  onDone: () => void
  onSaved?: () => void
}

const SAVE_FAILED = 'Your result could not be saved right now. Please try again.'
const NEED_RESULT = 'Write what happened to continue.'

/**
 * The guided result of a test: what happened, and how strongly the thought is believed now. The
 * belief starts at the original one. Nothing is saved before the last step.
 */
export default function LogResultFlow({
  record,
  test,
  onDone,
  onSaved,
}: LogResultFlowProps): ReactElement {
  const [start] = useState(() => ({
    result: test.status === 'done' ? test.result : '',
    belief: test.status === 'done' ? test.belief : record.belief,
  }))
  const [result, setResult] = useState(start.result)
  const [belief, setBelief] = useState(start.belief)
  const [gone, setGone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const changed = result !== start.result || belief !== start.belief

  async function save(): Promise<void> {
    if (saving) {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      await saveThoughtTest(record.id, {
        status: 'done',
        plan: test.plan,
        prediction: test.prediction,
        result,
        belief,
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
        console.error('Test result could not be saved', error)
        setErrorMessage(SAVE_FAILED)
      }
      setSaving(false)
    }
  }

  const steps: readonly FlowStep[] = [
    {
      title: 'What happened',
      needs: result.trim() === '' ? NEED_RESULT : null,
      content: (
        <TextStep
          label="What happened when you tested it?"
          hint="What did you do, and what did you notice?"
          value={result}
          onChange={setResult}
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
  ]

  return (
    <StepFlow
      label="Log the result"
      eyebrow="Test result"
      discardTitle="Discard this result?"
      steps={steps}
      aboveStep={<ThoughtLine thought={record.thought} />}
      reachedAtStart={test.status === 'done' ? steps.length - 1 : 0}
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
