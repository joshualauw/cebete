import type { ReactElement } from 'react'

import ConfirmedRemove from './ConfirmedRemove'
import { deleteThoughtRecord } from './repository'

type DeleteSectionProps = {
  recordId: number
  /** Whether the question "Delete this record?" is open. */
  asking: boolean
  /** Switches Delete off, for example while another flow is open. */
  locked: boolean
  onAsk: () => void
  onKeep: () => void
  onDeleted: () => void
}

/** Deleting the record, behind a question, since it cannot be undone. */
export default function DeleteSection({
  recordId,
  asking,
  locked,
  onAsk,
  onKeep,
  onDeleted,
}: DeleteSectionProps): ReactElement {
  return (
    <ConfirmedRemove
      buttonLabel="Delete this record"
      groupLabel="Delete this thought record"
      question="Delete this record? This cannot be undone."
      confirmLabel="Yes, delete"
      progressLabel="Deleting…"
      failedMessage="This record could not be deleted right now. Please try again."
      logMessage="Thought record could not be deleted"
      remove={() => deleteThoughtRecord(recordId)}
      asking={asking}
      locked={locked}
      onAsk={onAsk}
      onKeep={onKeep}
      onRemoved={onDeleted}
    />
  )
}
