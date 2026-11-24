// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

// The PWA config lives at the project root, outside `src/`, so the `@` alias cannot reach it.
// This relative import is the single exception to the alias rule.
import { manifest, pwaOptions } from '../pwa.config'

const publicDir = path.resolve(import.meta.dirname, '..', 'public')

/** Reads the real pixel size from a PNG file header, so a wrong or stale icon is caught. */
function readPngSize(filePath: string): string {
  const header = readFileSync(filePath)
  return `${String(header.readUInt32BE(16))}x${String(header.readUInt32BE(20))}`
}

describe('PWA manifest', () => {
  it('names the app cebete', () => {
    expect(manifest.name).toBe('cebete')
    expect(manifest.short_name).toBe('cebete')
  })

  it('opens like an installed app', () => {
    expect(manifest.display).toBe('standalone')
    expect(manifest.start_url).toBe('/')
    expect(manifest.scope).toBe('/')
  })

  it('declares the standard icons, including a maskable one', () => {
    const icons = manifest.icons ?? []
    const find = (size: string, purpose: string) =>
      icons.find((icon) => icon.sizes === size && icon.purpose === purpose)

    expect(find('192x192', 'any')).toBeDefined()
    expect(find('512x512', 'any')).toBeDefined()
    expect(find('512x512', 'maskable')).toBeDefined()
  })

  it('points every icon at a real PNG of the declared size', () => {
    for (const icon of manifest.icons ?? []) {
      expect(icon.type).toBe('image/png')
      expect(readPngSize(path.join(publicDir, icon.src))).toBe(icon.sizes)
    }
  })
})

describe('PWA offline caching', () => {
  it('updates itself and precaches the app shell so it opens offline', () => {
    expect(pwaOptions.registerType).toBe('autoUpdate')
    expect(pwaOptions.includeManifestIcons).toBe(false)

    const patterns = pwaOptions.workbox?.globPatterns ?? []
    for (const extension of ['js', 'css', 'html', 'svg', 'png']) {
      expect(patterns.join(',')).toContain(extension)
    }
  })
})
