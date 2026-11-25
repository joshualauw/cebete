import { Box, Button, Flex, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef } from 'react'
import { LuPencil } from 'react-icons/lu'

import ConfirmedRemove from '@/shared/ConfirmedRemove'

import { deleteCopingItem } from './repository'
import type { CopingItem } from './types'

type CopingItemRowProps = {
  item: CopingItem
  /** Called when the user chooses Edit. */
  onEdit: () => void
  /** Whether the question "Delete this item?" is open. The list decides, so only one is open. */
  asking: boolean
  onAskDelete: () => void
  onKeep: () => void
  /** Called after the item has been deleted. */
  onDeleted: () => void
  /** Switches Edit and Delete off, for example while a form or a question is open. */
  actionsDisabled: boolean
  /** Moves focus to the Edit action when the item appears, after its form was closed. */
  focusEdit: boolean
}

/** One coping item: its short text, and its detail under it when it has one. */
export default function CopingItemRow({
  item,
  onEdit,
  asking,
  onAskDelete,
  onKeep,
  onDeleted,
  actionsDisabled,
  focusEdit,
}: CopingItemRowProps): ReactElement {
  const editRef = useRef<HTMLButtonElement>(null)

  // Coming back from the edit form, put focus on the Edit action so the user keeps their place.
  useEffect(() => {
    if (focusEdit) {
      editRef.current?.focus()
    }
  }, [focusEdit])

  const name = `“${item.text}”`

  return (
    <Box as="li" bg="bg.muted" borderRadius="xl" p="4">
      <Stack gap="2">
        <Flex justify="space-between" align="flex-start" gap="3">
          <Box minW="0">
            <Text fontWeight="semibold" overflowWrap="anywhere">
              {item.text}
            </Text>
            {item.detail ? (
              <Text mt="1" color="fg.muted" whiteSpace="pre-wrap" overflowWrap="anywhere">
                {item.detail}
              </Text>
            ) : null}
          </Box>
          {asking ? null : (
            <Button
              ref={editRef}
              variant="ghost"
              minH="12"
              flexShrink="0"
              disabled={actionsDisabled}
              aria-label={`Edit ${name}`}
              onClick={onEdit}
            >
              <LuPencil aria-hidden="true" />
              Edit
            </Button>
          )}
        </Flex>
        <ConfirmedRemove
          buttonLabel="Delete"
          buttonName={`Delete ${name}`}
          groupLabel={`Delete ${name}`}
          question="Delete this item? This cannot be undone."
          confirmLabel="Yes, delete"
          progressLabel="Deleting…"
          failedMessage="This item could not be deleted right now. Please try again."
          logMessage="Coping item could not be deleted"
          remove={() => deleteCopingItem(item.id)}
          asking={asking}
          locked={actionsDisabled}
          onAsk={onAskDelete}
          onKeep={onKeep}
          onRemoved={onDeleted}
        />
      </Stack>
    </Box>
  )
}
