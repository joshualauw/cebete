import type { ReactElement } from 'react'

import ConfirmedRemove from './ConfirmedRemove'
import { removeThoughtPlan } from './repository'

type RemovePlanSectionProps = {
  recordId: number
  /** Whether the question "Remove this plan?" is open. */
  asking: boolean
  /** Switches the control off, for example while another flow is open. */
  locked: boolean
  onAsk: () => void
  onKeep: () => void
  onRemoved: () => void
}

/** Dropping a planned test before its result is logged, behind a question. */
export default function RemovePlanSection({
  recordId,
  asking,
  locked,
  onAsk,
  onKeep,
  onRemoved,
}: RemovePlanSectionProps): ReactElement {
  return (
    <ConfirmedRemove
      buttonLabel="Remove the plan"
      groupLabel="Remove this plan"
      question="Remove this plan? This cannot be undone."
      confirmLabel="Yes, remove"
      progressLabel="Removing…"
      failedMessage="This plan could not be removed right now. Please try again."
      logMessage="Test plan could not be removed"
      remove={async () => {
        await removeThoughtPlan(recordId)
      }}
      asking={asking}
      locked={locked}
      onAsk={onAsk}
      onKeep={onKeep}
      onRemoved={onRemoved}
    />
  )
}
