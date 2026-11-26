import { Box, Heading, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'

import { COPING_TYPES, type CopingItem, type CopingType } from './types'
import type { CopingItemsState } from './useCopingItems'

/** In this moment an About me item is a reminder, not an item to manage. */
const GROUP_LABELS: Readonly<Record<CopingType, string>> = {
  do: 'Do',
  nearby: 'Keep nearby',
  say: 'Tell myself',
  about: 'Remember',
}

type ItemCardsProps = {
  items: readonly CopingItem[]
}

function ItemCards({ items }: ItemCardsProps): ReactElement {
  return (
    <Box as="ul" display="flex" flexDirection="column" gap="3" listStyleType="none" m="0" p="0">
      {items.map((item) => (
        <Box key={item.id} as="li" bg="bg.muted" borderRadius="xl" p="4">
          {/* A green title, and the content indented. */}
          <Heading as="h3" size="md" color="colorPalette.fg" overflowWrap="anywhere">
            {item.text}
          </Heading>
          {item.detail ? (
            <Text mt="2" ps="5" fontSize="lg" whiteSpace="pre-wrap" overflowWrap="anywhere">
              {item.detail}
            </Text>
          ) : null}
        </Box>
      ))}
    </Box>
  )
}

type SettleGroupsProps = {
  state: CopingItemsState
}

/**
 * Everything the quick-use screen offers: the user's library items, by kind. A group with
 * nothing in it is left out. Nothing is shown while the items are loading, and if they cannot be
 * loaded only a calm message is.
 */
export default function SettleGroups({ state }: SettleGroupsProps): ReactElement | null {
  if (state.status === 'loading') {
    return null
  }

  if (state.status === 'error') {
    return (
      <Box role="status" bg="bg.muted" borderRadius="xl" p="4">
        Your items could not be loaded right now.
      </Box>
    )
  }

  return (
    <Box display="flex" flexDirection="column" gap="6">
      {COPING_TYPES.map((type) => {
        const group = state.items.filter((item) => item.type === type)

        if (group.length === 0) {
          return null
        }

        return (
          <Box as="section" key={type} aria-labelledby={`settle-group-${type}`}>
            <Heading as="h2" id={`settle-group-${type}`} size="lg" color="colorPalette.fg" mb="3">
              {GROUP_LABELS[type]}
            </Heading>
            <ItemCards items={group} />
          </Box>
        )
      })}
    </Box>
  )
}
