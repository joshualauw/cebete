// Older browsers and some embedded views have no storage manager at all, which the DOM
// types do not admit. The return type states it so callers must handle the missing case.
function getStorageManager(): StorageManager | undefined {
  return navigator.storage
}

/**
 * Asks the browser to keep this app's stored data instead of evicting it under storage
 * pressure. Resolves to whether the data is now persistent. It never throws: a refusal,
 * an unsupported browser or an error all resolve to `false` so the app keeps working.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = getStorageManager()

  if (typeof storage?.persist !== 'function') {
    return false
  }

  try {
    if (await storage.persisted()) {
      return true
    }

    return await storage.persist()
  } catch {
    return false
  }
}
