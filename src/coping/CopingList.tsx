import { Box, Heading, Text, VisuallyHidden } from '@chakra-ui/react'
import { type ReactElement, useEffect, useRef, useState } from 'react'

import CopingForm from './CopingForm'
import CopingItemRow from './CopingItemRow'
import { COPING_TYPE_LABELS, COPING_TYPES } from './types'
import { useCopingItems } from './useCopingItems'

type CopingListProps = {
  /** Switches every Edit and Delete action off, for example while the add form is open. */
  locked?: boolean
  /** Told whenever a form or a question opens or closes in the list. */
  onBusyChange?: (busy: boolean) => void
}

function itemsLeft(count: number): string {
  if (count === 0) {
    return 'No items left.'
  }

  return count === 1 ? '1 item left.' : `${String(count)} items left.`
}

/**
 * The coping items in four groups, in a fixed order. A group with no items is left out, and a
 * friendly message invites the first item when there are none. An item can be edited in place or
 * deleted behind a question, one at a time.
 */
export default function CopingList({
  locked = false,
  onBusyChange,
}: CopingListProps): ReactElement | null {
  const state = useCopingItems()
  const [announcement, setAnnouncement] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [askingId, setAskingId] = useState<number | null>(null)
  const [returnedId, setReturnedId] = useState<number | null>(null)
  const regionRef = useRef<HTMLElement>(null)

  const items = state.status === 'ready' ? state.items : []
  // An item that vanishes while its form or question is open leaves nothing to edit or delete.
  const activeEditingId = items.some((item) => item.id === editingId) ? editingId : null
  const activeAskingId = items.some((item) => item.id === askingId) ? askingId : null
  const busy = activeEditingId !== null || activeAskingId !== null

  useEffect(() => {
    onBusyChange?.(busy)
  }, [busy, onBusyChange])

  // Show nothing while the first read is under way, so the empty state never flashes by mistake.
  if (state.status === 'loading') {
    return null
  }

  if (state.status === 'error') {
    return (
      <Box role="status" bg="bg.error" color="fg.error" borderRadius="xl" p="4">
        Your coping items could not be loaded right now. Please close the app and open it again.
      </Box>
    )
  }

  function handleDeleted(): void {
    setAskingId(null)
    setAnnouncement(`Item deleted. ${itemsLeft(Math.max(items.length - 1, 0))}`)
    // The deleted item is about to disappear, so keep the user's place in the list.
    regionRef.current?.focus()
  }

  function closeForm(id: number): void {
    setEditingId(null)
    setReturnedId(id)
  }

  return (
    <Box
      as="section"
      ref={regionRef}
      aria-label="Coping items"
      tabIndex={-1}
      outline="none"
      display="flex"
      flexDirection="column"
      gap="6"
    >
      <VisuallyHidden role="status">{announcement}</VisuallyHidden>
      {items.length === 0 ? (
        <Box textAlign="center" py="10">
          <Heading as="h2" size="lg" color="colorPalette.fg">
            No items yet
          </Heading>
          <Text mt="2" color="fg.muted">
            Add what helps you when worry rises: something to do, something to keep nearby, words to
            tell yourself, or something true about you.
          </Text>
        </Box>
      ) : (
        COPING_TYPES.map((type) => {
          const group = items.filter((item) => item.type === type)

          if (group.length === 0) {
            return null
          }

          return (
            <Box as="section" key={type} aria-labelledby={`coping-group-${type}`}>
              <Heading as="h2" id={`coping-group-${type}`} size="lg" color="colorPalette.fg" mb="3">
                {COPING_TYPE_LABELS[type]}
              </Heading>
              <Box
                as="ul"
                display="flex"
                flexDirection="column"
                gap="3"
                listStyleType="none"
                m="0"
                p="0"
              >
                {group.map((item) =>
                  item.id === activeEditingId ? (
                    <Box as="li" key={item.id}>
                      <CopingForm
                        item={item}
                        onSaved={() => {
                          setAnnouncement('Item updated.')
                        }}
                        onDone={() => {
                          closeForm(item.id)
                        }}
                      />
                    </Box>
                  ) : (
                    <CopingItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => {
                        setAnnouncement('')
                        setReturnedId(null)
                        setEditingId(item.id)
                      }}
                      asking={item.id === activeAskingId}
                      onAskDelete={() => {
                        setAnnouncement('')
                        setAskingId(item.id)
                      }}
                      onKeep={() => {
                        setAskingId(null)
                      }}
                      onDeleted={handleDeleted}
                      actionsDisabled={locked || (busy && item.id !== activeAskingId)}
                      focusEdit={item.id === returnedId}
                    />
                  ),
                )}
              </Box>
            </Box>
          )
        })
      )}
    </Box>
  )
}
