import { Box, Heading, Text } from '@chakra-ui/react'
import type { ReactElement } from 'react'

import StarterTechniques from './StarterTechniques'
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
  /** Calming words are shown larger, since they are meant to be read and said. */
  large?: boolean
}

function ItemCards({ items, large = false }: ItemCardsProps): ReactElement {
  return (
    <Box as="ul" display="flex" flexDirection="column" gap="3" listStyleType="none" m="0" p="0">
      {items.map((item) => (
        <Box key={item.id} as="li" bg="bg.muted" borderRadius="xl" p="4">
          <Text fontSize={large ? '2xl' : 'lg'} fontWeight="semibold" overflowWrap="anywhere">
            {item.text}
          </Text>
          {item.detail ? (
            <Text
              mt="1"
              fontSize="lg"
              color="fg.muted"
              whiteSpace="pre-wrap"
              overflowWrap="anywhere"
            >
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
 * Everything the quick-use screen offers: the built-in techniques first under Do, then the user's
 * own items by kind. The built-in techniques are always there, also while the items are loading
 * and when they cannot be loaded.
 */
export default function SettleGroups({ state }: SettleGroupsProps): ReactElement {
  const items = state.status === 'ready' ? state.items : []

  return (
    <Box display="flex" flexDirection="column" gap="6">
      {COPING_TYPES.map((type) => {
        const group = items.filter((item) => item.type === type)

        if (type !== 'do' && group.length === 0) {
          return null
        }

        return (
          <Box as="section" key={type} aria-labelledby={`settle-group-${type}`}>
            <Heading as="h2" id={`settle-group-${type}`} size="lg" color="colorPalette.fg" mb="3">
              {GROUP_LABELS[type]}
            </Heading>
            <Box display="flex" flexDirection="column" gap="3">
              {type === 'do' ? <StarterTechniques /> : null}
              {group.length === 0 ? null : <ItemCards items={group} large={type === 'say'} />}
              {type === 'do' && state.status === 'error' ? (
                <Box role="status" bg="bg.muted" borderRadius="xl" p="4">
                  Your own items could not be loaded right now. The built-in techniques are still
                  here.
                </Box>
              ) : null}
            </Box>
          </Box>
        )
      })}
    </Box>
  )
}
