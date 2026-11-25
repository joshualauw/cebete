import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CopingItemNotFoundError } from '@/coping/errors'
import {
  addCopingItem,
  deleteCopingItem,
  listCopingItems,
  updateCopingItem,
} from '@/coping/repository'
import { InvalidCopingItemError } from '@/coping/validation'
import { db } from '@/db/db'
import { copingItem } from '@tests/helpers/coping'

beforeEach(async () => {
  await db.copingItems.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('addCopingItem', () => {
  it('saves an item and returns it as stored', async () => {
    const added = await addCopingItem(copingItem('do', 'Slow breathing', 'in 4, out 6'))

    expect(added).toMatchObject({ type: 'do', text: 'Slow breathing', detail: 'in 4, out 6' })
    expect(await db.copingItems.get(added.id)).toEqual(added)
  })

  it('saves nothing when the item breaks a rule', async () => {
    await expect(addCopingItem(copingItem('do', '  '))).rejects.toBeInstanceOf(
      InvalidCopingItemError,
    )

    expect(await db.copingItems.count()).toBe(0)
  })

  it('does not save a blank detail', async () => {
    const added = await addCopingItem({ type: 'say', text: 'This will pass', detail: '  ' })

    expect(await db.copingItems.get(added.id)).toEqual({
      id: added.id,
      type: 'say',
      text: 'This will pass',
    })
  })
})

describe('listCopingItems', () => {
  it('is empty when nothing was added', async () => {
    expect(await listCopingItems()).toEqual([])
  })

  it('groups by kind in the fixed order, and keeps the order added within a group', async () => {
    await addCopingItem(copingItem('about', 'Good listener'))
    await addCopingItem(copingItem('say', 'This will pass'))
    await addCopingItem(copingItem('do', 'Walk'))
    await addCopingItem(copingItem('nearby', 'Photo of my sister'))
    await addCopingItem(copingItem('do', 'Slow breathing'))
    await addCopingItem(copingItem('about', 'Kind'))

    const items = await listCopingItems()

    expect(items.map((item) => `${item.type}:${item.text}`)).toEqual([
      'do:Walk',
      'do:Slow breathing',
      'nearby:Photo of my sister',
      'say:This will pass',
      'about:Good listener',
      'about:Kind',
    ])
  })

  describe('with a row that cannot be read', () => {
    it('leaves it out, never deletes it, and reports it once', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
      await addCopingItem(copingItem('do', 'Walk'))
      await db.table('copingItems').add({ type: 'sing', text: 'broken' })

      expect((await listCopingItems()).map((item) => item.text)).toEqual(['Walk'])
      expect((await listCopingItems()).map((item) => item.text)).toEqual(['Walk'])

      expect(await db.copingItems.count()).toBe(2)
      expect(warn).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('1 saved coping item'))
    })
  })
})

describe('updateCopingItem', () => {
  it('replaces the item and keeps its id and so its place', async () => {
    const first = await addCopingItem(copingItem('do', 'Walk'))
    await addCopingItem(copingItem('do', 'Breathe'))

    const updated = await updateCopingItem(first.id, copingItem('do', 'Long walk', 'to the park'))

    expect(updated).toEqual({ id: first.id, type: 'do', text: 'Long walk', detail: 'to the park' })
    expect((await listCopingItems()).map((item) => item.text)).toEqual(['Long walk', 'Breathe'])
  })

  it('can move an item to another kind', async () => {
    const item = await addCopingItem(copingItem('do', 'Calm card'))

    await updateCopingItem(item.id, copingItem('nearby', 'Calm card'))

    expect((await listCopingItems())[0]?.type).toBe('nearby')
  })

  it('removes a detail that was cleared', async () => {
    const item = await addCopingItem(copingItem('do', 'Walk', 'to the park'))

    await updateCopingItem(item.id, { type: 'do', text: 'Walk', detail: '' })

    expect(await db.copingItems.get(item.id)).toEqual({ id: item.id, type: 'do', text: 'Walk' })
  })

  it('changes nothing when the edit breaks a rule', async () => {
    const item = await addCopingItem(copingItem('do', 'Walk'))

    await expect(updateCopingItem(item.id, copingItem('do', ''))).rejects.toBeInstanceOf(
      InvalidCopingItemError,
    )

    expect(await db.copingItems.get(item.id)).toEqual(item)
  })

  it('never recreates an item that is gone', async () => {
    const item = await addCopingItem(copingItem('do', 'Walk'))
    await deleteCopingItem(item.id)

    await expect(updateCopingItem(item.id, copingItem('do', 'Walk again'))).rejects.toBeInstanceOf(
      CopingItemNotFoundError,
    )

    expect(await db.copingItems.count()).toBe(0)
  })
})

describe('deleteCopingItem', () => {
  it('removes only that item', async () => {
    const first = await addCopingItem(copingItem('do', 'Walk'))
    await addCopingItem(copingItem('do', 'Breathe'))

    await deleteCopingItem(first.id)

    expect((await listCopingItems()).map((item) => item.text)).toEqual(['Breathe'])
  })

  it('does nothing for an item that is gone', async () => {
    await expect(deleteCopingItem(999)).resolves.toBeUndefined()
  })
})
