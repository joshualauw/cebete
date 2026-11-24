import { afterEach, describe, expect, it, vi } from 'vitest'

import { requestPersistentStorage } from '@/db/persistence'

function stubStorage(storage: Partial<StorageManager> | undefined) {
  vi.stubGlobal('navigator', { storage })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requestPersistentStorage', () => {
  it('asks the browser to persist the data and reports success', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    stubStorage({ persisted: vi.fn().mockResolvedValue(false), persist })

    await expect(requestPersistentStorage()).resolves.toBe(true)
    expect(persist).toHaveBeenCalledOnce()
  })

  it('does not ask again when the data is already persistent', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    stubStorage({ persisted: vi.fn().mockResolvedValue(true), persist })

    await expect(requestPersistentStorage()).resolves.toBe(true)
    expect(persist).not.toHaveBeenCalled()
  })

  it('reports false, without throwing, when the browser refuses', async () => {
    stubStorage({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockResolvedValue(false),
    })

    await expect(requestPersistentStorage()).resolves.toBe(false)
  })

  it('reports false, without throwing, when the browser has no storage manager', async () => {
    stubStorage(undefined)

    await expect(requestPersistentStorage()).resolves.toBe(false)
  })

  it('reports false, without throwing, when the request itself fails', async () => {
    stubStorage({
      persisted: vi.fn().mockResolvedValue(false),
      persist: vi.fn().mockRejectedValue(new Error('denied')),
    })

    await expect(requestPersistentStorage()).resolves.toBe(false)
  })
})
