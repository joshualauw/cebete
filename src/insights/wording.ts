import type { Summary } from './summary'

function counted(count: number, one: string, other: string): string {
  if (count === 0) {
    return `no ${other}`
  }

  return count === 1 ? `1 ${one}` : `${String(count)} ${other}`
}

/** A belief rating or an average of them, without a decimal when it is a whole number. */
export function formatBelief(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** How many thoughts fall in the range, for example "3 thoughts in the last 7 days". */
export function describeBeliefCount(count: number, days: number): string {
  if (count === 0) {
    return `None in the last ${String(days)} days.`
  }

  return `${count === 1 ? '1 thought' : `${String(count)} thoughts`} in the last ${String(days)} days`
}

type Beliefs = { readonly before: number; readonly after: number }

/** The average belief, for example "Average belief: from 7.5 to 4". It judges nothing. */
export function describeAverageBelief({ before, after }: Beliefs): string {
  return `Average belief: from ${formatBelief(before)} to ${formatBelief(after)}`
}

/** One thought's belief, for example "from 8 to 4". It reads the same when belief went up. */
export function describeBeliefPair({ before, after }: Beliefs): string {
  return `from ${formatBelief(before)} to ${formatBelief(after)}`
}

/** The header of the summary, for example "Last 7 days: 5 mood entries, 3 thought records". */
export function describeSummary(days: number, summary: Summary): string {
  const entries = counted(summary.moodEntries, 'mood entry', 'mood entries')
  const records = counted(summary.thoughtRecords, 'thought record', 'thought records')

  return `Last ${String(days)} days: ${entries}, ${records}`
}
