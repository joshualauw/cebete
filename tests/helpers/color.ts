import { system } from '@/theme/system'

const REFERENCE = /^\{(.+)\}$/

/** Picks the light-mode value out of a semantic token's conditions, if it has one. */
function lightValue(conditions: unknown): unknown {
  if (typeof conditions !== 'object' || conditions === null) {
    return undefined
  }

  if ('base' in conditions) {
    return conditions.base
  }

  if ('_light' in conditions) {
    return conditions._light
  }

  return undefined
}

/**
 * Resolves a colour token of the cebete theme to its hex value, following references such as
 * `{colors.gray.900}`. Semantic tokens are read in their light form, since the app is light only.
 */
export function resolveColor(name: string): string {
  const token = system.tokens.getByName(`colors.${name}`)

  if (!token) {
    throw new Error(`Unknown colour token: ${name}`)
  }

  // Chakra types this loosely, so treat it as unknown until it has been narrowed.
  const conditions: unknown = token.extensions.conditions
  const raw: unknown = conditions === undefined ? token.value : lightValue(conditions)

  if (typeof raw !== 'string') {
    throw new Error(`Colour token ${name} has no light value`)
  }

  const reference = REFERENCE.exec(raw)

  if (reference?.[1]) {
    return resolveColor(reference[1].replace(/^colors\./, ''))
  }

  return raw
}

type Rgb = readonly [red: number, green: number, blue: number]

function parseHex(hex: string): Rgb {
  const digits = hex.replace('#', '')
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((digit) => digit + digit)
          .join('')
      : digits

  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Not a hex colour: ${hex}`)
  }

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ]
}

function relativeLuminance(hex: string): number {
  const [red, green, blue] = parseHex(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * (red ?? 0) + 0.7152 * (green ?? 0) + 0.0722 * (blue ?? 0)
}

/** WCAG contrast ratio between two colours, from 1 (identical) to 21 (black on white). */
export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * How vivid a colour is, from 0 (grey) to 1: the spread between its strongest and weakest
 * channel. Unlike HSL saturation, very pale tints score low, as they look. A vivid red such
 * as #ef4444 scores about 0.67, while the muted clay rose used for errors stays under 0.35.
 */
export function chroma(hex: string): number {
  const [red = 0, green = 0, blue = 0] = parseHex(hex).map((channel) => channel / 255)

  return Math.max(red, green, blue) - Math.min(red, green, blue)
}

/** HSL hue in degrees, 0 to 360. Teal sits around 170. */
export function hue(hex: string): number {
  const [red = 0, green = 0, blue = 0] = parseHex(hex).map((channel) => channel / 255)
  const max = Math.max(red, green, blue)
  const delta = max - Math.min(red, green, blue)

  if (delta === 0) {
    return 0
  }

  const segment =
    max === red
      ? ((green - blue) / delta) % 6
      : max === green
        ? (blue - red) / delta + 2
        : (red - green) / delta + 4

  return (segment * 60 + 360) % 360
}
