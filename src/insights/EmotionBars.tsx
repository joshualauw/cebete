import { Box, Flex, Text, VisuallyHidden } from '@chakra-ui/react'
import type { ReactElement } from 'react'

import { emotionLabel } from '@/mood/emotions'

import type { EmotionCount } from './summary'

type EmotionBarsProps = {
  /** Most frequent first. The first one sets the length of a full bar. */
  counts: readonly EmotionCount[]
}

/**
 * The most frequent emotions as simple horizontal bars. Each row also says its emotion and its
 * count in words, so the bar is only decoration: it is hidden from assistive technology, and
 * nothing depends on colour.
 */
export default function EmotionBars({ counts }: EmotionBarsProps): ReactElement {
  const most = counts[0]?.count ?? 1

  return (
    <Box
      as="ul"
      aria-label="Most frequent emotions"
      display="flex"
      flexDirection="column"
      gap="3"
      listStyleType="none"
      m="0"
      p="0"
    >
      {counts.map(({ emotion, count }) => (
        <Box as="li" key={emotion}>
          <Flex justify="space-between" align="baseline" gap="3">
            <Text>{emotionLabel(emotion)}</Text>
            <Text fontWeight="semibold">
              <VisuallyHidden>Named </VisuallyHidden>
              {count}
              <VisuallyHidden>{count === 1 ? ' time' : ' times'}</VisuallyHidden>
            </Text>
          </Flex>
          <Box aria-hidden="true" mt="1" h="2" bg="bg.emphasized" borderRadius="full">
            <Box
              h="full"
              bg="colorPalette.solid"
              borderRadius="full"
              width={`${String(Math.round((count / most) * 100))}%`}
            />
          </Box>
        </Box>
      ))}
    </Box>
  )
}
