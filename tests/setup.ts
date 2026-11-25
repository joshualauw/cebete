import '@testing-library/jest-dom/vitest'
// Gives the tests an in-memory IndexedDB so the database runs without a real browser.
import 'fake-indexeddb/auto'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  // The browser's own storage must not carry one test's choices into the next. Some tests run
  // in a Node environment, which has none.
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
})
