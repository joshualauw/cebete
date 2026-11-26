import { Box, Heading, Stack, Text } from '@chakra-ui/react'
import { type ReactElement, useId, useState } from 'react'

import { beliefChanges } from './beliefChange'
import BeliefChangeBlock from './BeliefChangeBlock'
import EmotionBars from './EmotionBars'
import { DEFAULT_RANGE_DAYS, type RangeDays } from './range'
import RangeToggle from './RangeToggle'
import { summarize } from './summary'
import { useSummaryData } from './useSummaryData'
import { describeSummary } from './wording'

/**
 * A short summary of the last week or month: how many mood entries and thought records, and the
 * emotions named most often. It reports counts and nothing else, never a judgement.
 */
export default function HomeSummary(): ReactElement | null {
  const titleId = useId()
  const data = useSummaryData()
  const [days, setDays] = useState<RangeDays>(DEFAULT_RANGE_DAYS)
  // Taken once, when the panel first shows, so rendering stays pure. A summary only needs to be
  // right when the page opens.
  const [now] = useState(() => Date.now())

  // Show nothing until the first read is done, so the empty message never flashes by mistake.
  if (data.status === 'loading') {
    return null
  }

  if (data.status === 'error') {
    return (
      <Box role="status" bg="bg.muted" borderRadius="xl" p="4">
        Your summary could not be loaded right now.
      </Box>
    )
  }

  const summary = summarize({ entries: data.entries, records: data.records, days, now })
  const belief = beliefChanges({ records: data.records, days, now })
  const nothing = summary.moodEntries === 0 && summary.thoughtRecords === 0

  return (
    <Box
      as="section"
      aria-labelledby={titleId}
      bg="bg"
      borderWidth="1px"
      borderColor="border"
      borderRadius="xl"
      p="5"
    >
      <Stack gap="4">
        <Heading as="h2" id={titleId} size="lg" color="colorPalette.fg">
          Summary
        </Heading>
        <RangeToggle value={days} onChange={setDays} />
        {/* Announced politely when the range changes. */}
        <Text aria-live="polite" fontWeight="semibold">
          {describeSummary(days, summary)}
        </Text>
        {nothing ? (
          <Text color="fg.muted">
            Not enough yet. Log a few mood entries or thoughts, and what comes up most often will
            show here.
          </Text>
        ) : (
          <Stack gap="3">
            <Heading as="h3" size="md">
              Named most often
            </Heading>
            <EmotionBars counts={summary.topEmotions} />
          </Stack>
        )}
        {/* Always shown: a thought from before the range can have been challenged inside it. */}
        <BeliefChangeBlock title="Challenged thoughts" change={belief.challenged} days={days} />
        <BeliefChangeBlock title="Tested thoughts" change={belief.tested} days={days} />
      </Stack>
    </Box>
  )
}
