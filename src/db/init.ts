import { db } from './db'
import { requestPersistentStorage } from './persistence'

/**
 * Opens the local database and asks the browser to keep it. Called once at startup,
 * without blocking the first render.
 */
export async function initStorage(): Promise<void> {
  await db.open()
  await requestPersistentStorage()
}
