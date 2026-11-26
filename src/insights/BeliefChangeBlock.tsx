import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useId } from 'react'

import type { BeliefChange } from './beliefChange'
import { describeAverageBelief, describeBeliefCount, describeBeliefPair } from './wording'

type BeliefChangeBlockProps = {
  title: string
  change: BeliefChange
  days: number
}

/**
 * How belief changed for the thoughts that were challenged, or tested, in the range: an average
 * from three thoughts on, and each thought with its belief before and after below that. It only
 * reports the numbers, and reads the same whichever way belief moved.
 */
export default function BeliefChangeBlock({
  title,
  change,
  days,
}: BeliefChangeBlockProps): ReactElement {
  const titleId = useId()

  return (
    <Box as="section" aria-labelledby={titleId}>
      <Stack gap="2">
        <Heading as="h3" id={titleId} size="md">
          {title}
        </Heading>
        <Text color="fg.muted">{describeBeliefCount(change.count, days)}</Text>
        {change.average ? (
          <Text fontWeight="semibold">{describeAverageBelief(change.average)}</Text>
        ) : change.pairs.length === 0 ? null : (
          <Box
            as="ul"
            display="flex"
            flexDirection="column"
            gap="2"
            listStyleType="none"
            m="0"
            p="0"
          >
            {change.pairs.map((pair) => (
              <Box as="li" key={pair.id}>
                {/* Kept to a couple of lines on screen; a screen reader still reads all of it. */}
                <Text lineClamp="2" overflowWrap="anywhere">
                  {pair.thought}
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {describeBeliefPair(pair)}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
    </Box>
  )
}
