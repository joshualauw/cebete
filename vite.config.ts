import { readFileSync } from 'node:fs'
import path from 'node:path'

import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'

import { pwaOptions } from './pwa.config.ts'

function readVersion(): string {
  const manifest: unknown = JSON.parse(
    readFileSync(path.resolve(import.meta.dirname, 'package.json'), 'utf8'),
  )

  if (
    typeof manifest === 'object' &&
    manifest !== null &&
    'version' in manifest &&
    typeof manifest.version === 'string'
  ) {
    return manifest.version
  }

  throw new Error('package.json has no version')
}

export default defineConfig({
  plugins: [react(), VitePWA(pwaOptions)],
  define: {
    __APP_VERSION__: JSON.stringify(readVersion()),
  },
  resolve: {
    // Keep in sync with `paths` in tsconfig.app.json. The test runner reuses these aliases.
    // `@tests` lets tests share helpers without climbing out of their folder.
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@tests': path.resolve(import.meta.dirname, 'tests'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
})
