import { VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useState } from 'react'
import { useNavigate } from 'react-router'

import { paths } from '@/navigation/paths'

import BodyForm from './BodyForm'
import ChallengeFlow from './ChallengeFlow'
import DeleteSection from './DeleteSection'
import { afterDelete } from './listState'
import LogResultFlow from './LogResultFlow'
import PlanTestFlow from './PlanTestFlow'
import { BodySection, ChallengeSection, TestSection, ThoughtSection } from './RecordSections'
import RemovePlanSection from './RemovePlanSection'
import ThoughtRecordFlow from './ThoughtRecordFlow'
import type { ThoughtRecord } from './types'

type RecordDetailProps = {
  record: ThoughtRecord
}

type Flow = 'edit' | 'challenge' | 'plan' | 'result' | 'removePlan' | 'body' | 'delete'

/**
 * A record on its own screen: the thought, its challenge and its test, each of which can be
 * worked on in place, and Delete. Only one of them is open at a time, so what the user typed is
 * never lost silently.
 */
export default function RecordDetail({ record }: RecordDetailProps): ReactElement {
  const navigate = useNavigate()
  const [flow, setFlow] = useState<Flow | null>(null)
  const [returned, setReturned] = useState<Flow | null>(null)
  const [announcement, setAnnouncement] = useState('')

  function open(next: Flow): void {
    setAnnouncement('')
    setReturned(null)
    setFlow(next)
  }

  function close(closed: Flow): void {
    setFlow(null)
    setReturned(closed)
  }

  return (
    <>
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      {flow === 'edit' ? (
        <ThoughtRecordFlow
          record={record}
          onSaved={() => {
            setAnnouncement('Record updated.')
          }}
          onDone={() => {
            close('edit')
          }}
        />
      ) : (
        <ThoughtSection
          record={record}
          locked={flow !== null}
          focusEdit={returned === 'edit'}
          onEdit={() => {
            open('edit')
          }}
        />
      )}
      {flow === 'challenge' ? (
        <ChallengeFlow
          record={record}
          onSaved={() => {
            setAnnouncement('Challenge saved.')
          }}
          onDone={() => {
            close('challenge')
          }}
        />
      ) : (
        <ChallengeSection
          record={record}
          locked={flow !== null}
          focusAction={returned === 'challenge'}
          onChallenge={() => {
            open('challenge')
          }}
        />
      )}
      {flow === 'plan' ? (
        <PlanTestFlow
          record={record}
          onSaved={() => {
            setAnnouncement(record.test ? 'Plan updated.' : 'Test planned.')
          }}
          onDone={() => {
            close('plan')
          }}
        />
      ) : flow === 'result' && record.test ? (
        <LogResultFlow
          record={record}
          test={record.test}
          onSaved={() => {
            setAnnouncement(
              record.test?.status === 'done' ? 'Result updated.' : 'Test result saved.',
            )
          }}
          onDone={() => {
            close('result')
          }}
        />
      ) : (
        <TestSection
          record={record}
          locked={flow !== null}
          focusAction={returned === 'plan' || returned === 'result' ? returned : null}
          onPlan={() => {
            open('plan')
          }}
          onLogResult={() => {
            open('result')
          }}
        />
      )}
      {record.test?.status === 'planned' ? (
        <RemovePlanSection
          recordId={record.id}
          asking={flow === 'removePlan'}
          locked={flow !== null && flow !== 'removePlan'}
          onAsk={() => {
            open('removePlan')
          }}
          onKeep={() => {
            close('removePlan')
          }}
          onRemoved={() => {
            setAnnouncement('Plan removed.')
            // The Test part is back to its prompt, so focus goes to "Plan a test".
            close('plan')
          }}
        />
      ) : null}
      {flow === 'body' ? (
        <BodyForm
          record={record}
          onSaved={() => {
            setAnnouncement('Body notes saved.')
          }}
          onDone={() => {
            close('body')
          }}
        />
      ) : (
        <BodySection
          record={record}
          locked={flow !== null}
          focusAction={returned === 'body'}
          onEdit={() => {
            open('body')
          }}
        />
      )}
      <DeleteSection
        recordId={record.id}
        asking={flow === 'delete'}
        locked={flow !== null}
        onAsk={() => {
          open('delete')
        }}
        onKeep={() => {
          close('delete')
        }}
        onDeleted={() => {
          void navigate(paths.thoughts, { state: afterDelete })
        }}
      />
    </>
  )
}
