// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

// The PWA config lives at the project root, outside `src/`, so the `@` alias cannot reach it.
// This relative import is an exception to the alias rule, like the PWA test.
import { manifest, THEME_COLOR } from '../pwa.config'

const html = readFileSync(path.resolve(import.meta.dirname, '..', 'index.html'), 'utf8')

/** The content of the `<meta>` tag with the given name, whatever order its attributes are in. */
function metaContent(name: string): string | undefined {
  for (const tag of html.match(/<meta\b[^>]*>/gs) ?? []) {
    if (new RegExp(`name\\s*=\\s*"${name}"`).test(tag)) {
      return /content\s*=\s*"([^"]*)"/.exec(tag)?.[1]
    }
  }

  return undefined
}

describe('index.html: what the page says about itself', () => {
  it('has a description, the same one the installed app declares', () => {
    expect(metaContent('description')).toBeDefined()
    expect(metaContent('description')).toBe(manifest.description)
  })

  it('has a theme colour, the same one the installed app declares', () => {
    expect(metaContent('theme-color')).toBe(THEME_COLOR)
    expect(metaContent('theme-color')).toBe(manifest.theme_color)
  })

  it('has exactly one of each, so a browser has nothing to choose between', () => {
    expect(html.match(/name\s*=\s*"description"/g)).toHaveLength(1)
    expect(html.match(/name\s*=\s*"theme-color"/g)).toHaveLength(1)
  })

  it('keeps the tags it already had', () => {
    expect(html).toContain('<meta charset="UTF-8" />')
    expect(metaContent('viewport')).toBe(
      'width=device-width, initial-scale=1.0, viewport-fit=cover',
    )
    expect(metaContent('color-scheme')).toBe('light')
    expect(html).toContain('<title>cebete</title>')
    expect(html).toContain('href="/icon.svg"')
    expect(html).toContain('href="/favicon-32.png"')
    expect(html).toContain('href="/apple-touch-icon.png"')
    expect(html).toContain('<div id="root"></div>')
  })
})
