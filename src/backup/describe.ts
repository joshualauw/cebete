import { backupTables } from './registry'

function joinWithAnd(parts: readonly string[]): string {
  const last = parts.at(-1) ?? ''

  return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${last}` : last
}

/** How many rows a backup holds in all. */
export function totalCount(counts: Readonly<Record<string, number>>): number {
  return Object.values(counts).reduce((sum, count) => sum + count, 0)
}

/** The contents of a backup in words, for example "3 mood entries". Empty if it holds nothing. */
export function describeCounts(counts: Readonly<Record<string, number>>): string {
  const parts: string[] = []

  for (const [name, count] of Object.entries(counts)) {
    const table = backupTables[name]

    if (table && count > 0) {
      parts.push(`${String(count)} ${count === 1 ? table.label.one : table.label.other}`)
    }
  }

  return joinWithAnd(parts)
}

/** When a backup was made, in the user's own language and time zone. */
export function formatBackupDate(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
    Date.parse(isoDate),
  )
}

/** The day of the last backup, in the user's own language and time zone. */
export function formatLastBackupDate(at: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(at)
}

/** What to tell the user after a backup was restored. */
export function describeRestore(counts: Readonly<Record<string, number>>): string {
  const contents = describeCounts(counts)

  return contents
    ? `Your data was restored with ${contents}.`
    : 'Your data was restored. The backup held no entries, so nothing is stored on this device now.'
}

/** What to tell the user after a backup was made. */
export function describeExport(counts: Readonly<Record<string, number>>, skipped: number): string {
  const contents = describeCounts(counts)
  const saved = contents
    ? `Backup saved with ${contents}.`
    : 'Backup saved. There was nothing to back up yet.'

  if (skipped === 0) {
    return saved
  }

  const left =
    skipped === 1
      ? '1 entry could not be read, so it was left out.'
      : `${String(skipped)} entries could not be read, so they were left out.`

  return `${saved} ${left}`
}
