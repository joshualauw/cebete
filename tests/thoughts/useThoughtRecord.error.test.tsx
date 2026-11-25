import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useThoughtRecord } from '@/thoughts/useThoughtRecord'

vi.mock('@/thoughts/repository', () => ({
  getThoughtRecord: vi.fn().mockRejectedValue(new Error('storage unavailable')),
}))

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useThoughtRecord: when storage fails', () => {
  it('reports an error state and the console, and does not throw', async () => {
    const report = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { result } = renderHook(() => useThoughtRecord(1))

    await waitFor(() => {
      expect(result.current).toEqual({ status: 'error' })
    })
    expect(report).toHaveBeenCalled()
  })
})
