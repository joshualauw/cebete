import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { chroma, contrastRatio, hue, resolveColor } from '@tests/helpers/color'
import { renderWithProviders } from '@tests/helpers/render'

/** WCAG AA for normal-sized text. */
const READABLE = 4.5

/** Above this chroma a colour counts as vivid. Muted tones stay well below it. */
const VIVID = 0.45

function injectedCss(): string {
  return Array.from(document.querySelectorAll('style'))
    .map((style) => style.textContent)
    .join('\n')
}

describe('cebete theme: teal palette', () => {
  it('uses the app icon teal as the main colour', () => {
    expect(resolveColor('brand.solid')).toBe('#0f766e')
  })

  it('keeps every main-colour step in the teal hue range', () => {
    for (const step of ['400', '500', '600', '700', '800']) {
      const degrees = hue(resolveColor(`brand.${step}`))

      expect(degrees).toBeGreaterThan(160)
      expect(degrees).toBeLessThan(185)
    }
  })

  it('makes the default colour palette the main colour', () => {
    renderWithProviders(<App />)

    expect(injectedCss()).toContain(
      '--chakra-colors-color-palette-solid:var(--chakra-colors-brand-solid)',
    )
  })
})

describe('cebete theme: calm warning and error colours', () => {
  it('keeps every error and warning colour muted, never a vivid red', () => {
    const tokens = [
      'fg.error',
      'bg.error',
      'border.error',
      'fg.warning',
      'bg.warning',
      'border.warning',
      ...['50', '300', '500', '700'].flatMap((step) => [`red.${step}`, `orange.${step}`]),
    ]

    for (const token of tokens) {
      expect(chroma(resolveColor(token)), token).toBeLessThan(VIVID)
    }
  })

  it('would notice a vivid red, so the check above means something', () => {
    expect(chroma('#ef4444')).toBeGreaterThan(VIVID)
    expect(chroma('#dc2626')).toBeGreaterThan(VIVID)
  })

  it('softens text from pure black', () => {
    expect(resolveColor('fg')).not.toBe('#000000')
    expect(resolveColor('fg').toLowerCase()).not.toBe('#09090b')
  })
})

describe('cebete theme: light only', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('declares a light colour scheme for the page', () => {
    renderWithProviders(<App />)

    expect(injectedCss()).toContain('color-scheme:light')
  })

  it('stays light when the browser prefers dark', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('prefers-color-scheme: dark'),
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))

    renderWithProviders(<App />)

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})

describe('cebete theme: readable contrast', () => {
  const pairs: readonly (readonly [label: string, foreground: string, background: string])[] = [
    ['body text on the page background', 'fg', 'bg.subtle'],
    ['body text on a surface', 'fg', 'bg'],
    ['muted text on the page background', 'fg.muted', 'bg.subtle'],
    ['muted text on a surface', 'fg.muted', 'bg'],
    ['subtle text on the page background', 'fg.subtle', 'bg.subtle'],
    ['subtle text on a surface', 'fg.subtle', 'bg'],
    ['button text on the main colour', 'brand.contrast', 'brand.solid'],
    ['active item on a surface', 'brand.fg', 'bg'],
    ['active item on its highlight', 'brand.fg', 'brand.subtle'],
    ['error text on the error background', 'fg.error', 'bg.error'],
    ['warning text on the warning background', 'fg.warning', 'bg.warning'],
  ]

  it.each(pairs)('%s is readable', (_label, foreground, background) => {
    const ratio = contrastRatio(resolveColor(foreground), resolveColor(background))

    expect(ratio).toBeGreaterThanOrEqual(READABLE)
  })
})
