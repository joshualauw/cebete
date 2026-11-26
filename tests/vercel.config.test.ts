// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

// The hosting and PWA config live at the project root, outside `src/`, so the `@` alias cannot
// reach them. This relative import is an exception to the alias rule, like the PWA test.
import { pwaOptions } from '../pwa.config'

const root = path.resolve(import.meta.dirname, '..')

function readText(file: string): string {
  return readFileSync(path.join(root, file), 'utf8')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readJson(file: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readText(file))

  if (!isRecord(parsed)) {
    throw new Error(`${file} is not a JSON object`)
  }

  return parsed
}

function listOf(config: Record<string, unknown>, key: string): readonly Record<string, unknown>[] {
  const value = config[key]

  if (!Array.isArray(value)) {
    return []
  }

  const items: readonly unknown[] = value

  return items.filter(isRecord)
}

const config = readJson('vercel.json')

/** The Cache-Control value a header rule sets for an address, or `undefined` if it sets none. */
function cacheControlFor(source: string): string | undefined {
  const rule = listOf(config, 'headers').find((entry) => entry.source === source)
  const headers = rule ? listOf(rule, 'headers') : []
  const header = headers.find((entry) => entry.key === 'Cache-Control')

  return typeof header?.value === 'string' ? header.value : undefined
}

describe('vercel.json: every address works', () => {
  it('sends every address to the app page, so a reload or a direct link opens the right screen', () => {
    expect(listOf(config, 'rewrites')).toEqual([{ source: '/(.*)', destination: '/index.html' }])
  })

  it('does not redirect or reshape addresses, which would change where the data lives', () => {
    expect(config).not.toHaveProperty('redirects')
    expect(config).not.toHaveProperty('cleanUrls')
    expect(config).not.toHaveProperty('trailingSlash')
  })
})

describe('vercel.json: the service worker and manifest are never stale', () => {
  it.each(['/sw.js', '/manifest.webmanifest'])('always revalidates %s', (source) => {
    const value = cacheControlFor(source)

    expect(value).toBeDefined()
    expect(value).toContain('max-age=0')
    expect(value).toContain('must-revalidate')
    expect(value).not.toContain('immutable')
  })

  it('names the files the PWA plugin really produces, since it is not told to rename them', () => {
    expect(pwaOptions.filename).toBeUndefined()
    expect(pwaOptions.manifestFilename).toBeUndefined()
    expect(pwaOptions.strategies).toBeUndefined()
  })

  it('does not set long-lived caching on the two files, whatever else is configured', () => {
    for (const rule of listOf(config, 'headers')) {
      for (const header of listOf(rule, 'headers')) {
        expect(String(header.value)).not.toMatch(/max-age=([1-9]\d*)/)
      }
    }
  })
})

describe('vercel.json: building the app', () => {
  it('uses the Vite framework and the project’s own build command', () => {
    const scripts = readJson('package.json').scripts

    expect(config.framework).toBe('vite')
    expect(config.buildCommand).toBe('npm run build')
    expect(isRecord(scripts) ? scripts.build : undefined).toEqual(
      expect.stringContaining('vite build'),
    )
  })

  it('collects the build from the folder Vite writes to, which the project does not change', () => {
    expect(config.outputDirectory).toBe('dist')
    expect(readText('vite.config.ts')).not.toContain('outDir')
  })

  it('points at the schema, so an editor can check the file', () => {
    expect(config.$schema).toBe('https://openapi.vercel.sh/vercel.json')
  })

  it('needs no environment variable or secret to build', () => {
    expect(config).not.toHaveProperty('env')
    expect(config).not.toHaveProperty('build')
  })
})

describe('package.json: the Node version', () => {
  const engines = readJson('package.json').engines
  const node = isRecord(engines) && typeof engines.node === 'string' ? engines.node : ''

  it('asks for a Node version, so the host does not pick an older default', () => {
    expect(node).not.toBe('')
  })

  it('is no looser than the toolchain: Vitest needs Node 22.12 or newer, so Node 20 is out', () => {
    expect(node).toContain('22.12')
    expect(node).not.toMatch(/(^|\|\|\s*)\^?(18|20)\./)
  })
})

describe('.gitignore', () => {
  const text = readText('.gitignore')

  it('keeps the host’s local project folder out of git', () => {
    expect(text.split(/\r?\n/)).toContain('.vercel')
  })

  it('ends with a newline, like the other files', () => {
    expect(text.endsWith('\n')).toBe(true)
  })
})
