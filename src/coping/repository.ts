import { db } from '@/db/db'

import { CopingItemNotFoundError } from './errors'
import { COPING_TYPES, type CopingItem, type NewCopingItem } from './types'
import { isCopingItem, validateNewCopingItem } from './validation'

/**
 * Saves a new item and returns it as stored. The item is checked first, and nothing is saved if
 * it breaks a rule.
 */
export async function addCopingItem(input: NewCopingItem): Promise<CopingItem> {
  const item = validateNewCopingItem(input)
  const id = await db.copingItems.add(item)

  return { ...item, id }
}

/**
 * Replaces a saved item with an edited one, keeping its id and so its place in its group. The
 * edit is checked first, and nothing is saved if it breaks a rule. An item that is gone is never
 * recreated. A detail that was cleared is removed from the stored item.
 */
export async function updateCopingItem(id: number, input: NewCopingItem): Promise<CopingItem> {
  const item = validateNewCopingItem(input)

  return db.transaction('rw', db.copingItems, async () => {
    if ((await db.copingItems.get(id)) === undefined) {
      throw new CopingItemNotFoundError()
    }

    const updated: CopingItem = { ...item, id }

    await db.copingItems.put(updated)

    return updated
  })
}

/** Deletes one item. It cannot be undone. Deleting an item that is gone does nothing. */
export async function deleteCopingItem(id: number): Promise<void> {
  await db.copingItems.delete(id)
}

/** How many unreadable rows were last reported, so the same problem is not repeated on every refresh. */
let lastReportedUnreadable = 0

function reportUnreadable(count: number): void {
  if (count === lastReportedUnreadable) {
    return
  }

  lastReportedUnreadable = count

  if (count > 0) {
    const one = count === 1
    console.warn(
      `${String(count)} saved coping ${one ? 'item' : 'items'} could not be read and ${one ? 'is' : 'are'} not shown`,
    )
  }
}

/**
 * Lists every item, grouped by type in the fixed group order, and in the order added within a
 * group. A row that cannot be read as an item is left out so it can never break the list. It is
 * not deleted, and it is reported once, not on every refresh.
 */
export async function listCopingItems(): Promise<CopingItem[]> {
  const rows: readonly unknown[] = await db.copingItems.toArray()
  const items = rows.filter(isCopingItem)

  reportUnreadable(rows.length - items.length)

  return items.sort(
    (a, b) => COPING_TYPES.indexOf(a.type) - COPING_TYPES.indexOf(b.type) || a.id - b.id,
  )
}
