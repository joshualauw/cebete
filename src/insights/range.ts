/** The ranges the summary offers, in days. */
export const RANGE_DAYS = [7, 30] as const

export type RangeDays = (typeof RANGE_DAYS)[number]

/** The range the summary starts on at every visit. */
export const DEFAULT_RANGE_DAYS: RangeDays = 7

/**
 * Where a range of the last `days` days begins: the start of the user's local day, `days - 1`
 * days before today, so today counts as one of them. A range has no end, since nothing can
 * have happened later than now.
 */
export function rangeStart(now: number, days: number): number {
  const start = new Date(now)

  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))

  return start.getTime()
}
