import { afterEach, describe, expect, it, vi } from 'vitest'

import { db, SCHEMA_VERSION } from '@/db/db'
import { initStorage } from '@/db/init'

afterEach(() => {
  db.close()
  vi.unstubAllGlobals()
})

describe('initStorage', () => {
  it('opens the local database and requests persistent storage', async () => {
    const persist = vi.fn().mockResolvedValue(true)
    vi.stubGlobal('navigator', {
      storage: { persisted: vi.fn().mockResolvedValue(false), persist },
    })

    await initStorage()

    expect(db.isOpen()).toBe(true)
    expect(db.verno).toBe(SCHEMA_VERSION)
    expect(persist).toHaveBeenCalledOnce()
  })

  it('still opens the database when the browser refuses persistent storage', async () => {
    vi.stubGlobal('navigator', {
      storage: {
        persisted: vi.fn().mockResolvedValue(false),
        persist: vi.fn().mockResolvedValue(false),
      },
    })

    await expect(initStorage()).resolves.toBeUndefined()
    expect(db.isOpen()).toBe(true)
  })
})
