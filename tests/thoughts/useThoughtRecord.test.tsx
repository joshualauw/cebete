import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { db } from '@/db/db'
import { addThoughtRecord } from '@/thoughts/repository'
import { useThoughtRecord } from '@/thoughts/useThoughtRecord'
import { newThought } from '@tests/helpers/thoughts'

beforeEach(async () => {
  await db.thoughtRecords.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useThoughtRecord', () => {
  it('is loading first, then ready with the record', async () => {
    const saved = await addThoughtRecord(newThought({ thought: 'I will fail' }))

    const { result } = renderHook(() => useThoughtRecord(saved.id))

    expect(result.current.status).toBe('loading')
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'ready', record: saved })
    })
  })

  it('reports a record that does not exist as missing', async () => {
    const { result } = renderHook(() => useThoughtRecord(404))

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'missing' })
    })
  })

  it('reports an unreadable row as missing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const id: unknown = await db.table('thoughtRecords').add({ createdAt: 1, thought: 'damaged' })

    expect(typeof id).toBe('number')

    if (typeof id !== 'number') {
      return
    }

    const { result } = renderHook(() => useThoughtRecord(id))

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'missing' })
    })
  })

  it('follows changes to the stored record, and to its removal', async () => {
    const saved = await addThoughtRecord(newThought({ thought: 'First' }))
    const { result } = renderHook(() => useThoughtRecord(saved.id))

    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })

    await db.thoughtRecords.update(saved.id, { thought: 'Second' })
    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'ready', record: { thought: 'Second' } })
    })

    await db.thoughtRecords.delete(saved.id)
    await waitFor(() => {
      expect(result.current).toEqual({ status: 'missing' })
    })
  })

  it('never shows the previous record after the id changes', async () => {
    const first = await addThoughtRecord(newThought({ thought: 'First' }))
    const second = await addThoughtRecord(newThought({ thought: 'Second' }))
    const { result, rerender } = renderHook(({ id }) => useThoughtRecord(id), {
      initialProps: { id: first.id },
    })

    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'ready', record: { id: first.id } })
    })

    rerender({ id: second.id })

    expect(result.current).not.toMatchObject({ status: 'ready', record: { id: first.id } })
    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'ready', record: { id: second.id } })
    })
  })
})
