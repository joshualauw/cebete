/**
 * One-time icon generator for cebete. It is a development tool, not part of the app:
 * nothing in `src/` imports it and it never ships in the build.
 *
 * It draws the app icon as vector artwork (an open "c" ring with a small dot, in calm
 * teal), then writes the SVG master and the PNG sizes the PWA manifest and the page need
 * into `public/`.
 *
 * Re-run it only when the artwork changes:
 *
 *   npm run icons
 *
 * Output (all under public/):
 *   icon.svg                    SVG master, rounded corners (favicon and "any" purpose)
 *   favicon-32.png              32x32 favicon fallback
 *   apple-touch-icon.png        180x180, full-bleed (iOS rounds the corners itself)
 *   icons/icon-192.png          192x192, "any" purpose
 *   icons/icon-512.png          512x512, "any" purpose
 *   icons/icon-maskable-512.png 512x512, full-bleed, artwork inside the safe zone
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const publicDir = path.resolve(import.meta.dirname, '..', 'public')

const VIEW = 512
const BACKGROUND = '#0f766e'
const GLYPH = '#f0fdfa'

// Ring geometry. The whole mark stays well inside the maskable safe zone, which is a
// circle covering the inner 80% of the icon (radius 0.4 * VIEW from the centre).
const CENTER = VIEW / 2
const RING_RADIUS = 120
const RING_WIDTH = 44
const GAP_HALF_ANGLE = 40 // degrees, the opening of the "c" on the right-hand side
const DOT_RADIUS = 24
const CORNER_RADIUS = 112

function pointOnRing(angleDegrees) {
  const radians = (angleDegrees * Math.PI) / 180
  return {
    x: CENTER + RING_RADIUS * Math.cos(radians),
    y: CENTER + RING_RADIUS * Math.sin(radians),
  }
}

function round(value) {
  return Math.round(value * 100) / 100
}

function buildSvg({ rounded }) {
  const start = pointOnRing(GAP_HALF_ANGLE)
  const end = pointOnRing(-GAP_HALF_ANGLE)
  const dotX = CENTER + RING_RADIUS

  const background = rounded
    ? `<rect width="${VIEW}" height="${VIEW}" rx="${CORNER_RADIUS}" fill="${BACKGROUND}"/>`
    : `<rect width="${VIEW}" height="${VIEW}" fill="${BACKGROUND}"/>`

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" width="${VIEW}" height="${VIEW}">`,
    `  <title>cebete</title>`,
    `  ${background}`,
    `  <path d="M ${round(start.x)} ${round(start.y)} A ${RING_RADIUS} ${RING_RADIUS} 0 1 1 ${round(end.x)} ${round(end.y)}" fill="none" stroke="${GLYPH}" stroke-width="${RING_WIDTH}" stroke-linecap="round"/>`,
    `  <circle cx="${dotX}" cy="${CENTER}" r="${DOT_RADIUS}" fill="${GLYPH}"/>`,
    `</svg>`,
    ``,
  ].join('\n')
}

async function writePng(svg, size, filePath) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(filePath)
  console.log(`wrote ${path.relative(publicDir, filePath)} (${size}x${size})`)
}

async function main() {
  const rounded = buildSvg({ rounded: true })
  const fullBleed = buildSvg({ rounded: false })

  await mkdir(path.join(publicDir, 'icons'), { recursive: true })

  await writeFile(path.join(publicDir, 'icon.svg'), rounded)
  console.log('wrote icon.svg')

  await writePng(rounded, 32, path.join(publicDir, 'favicon-32.png'))
  await writePng(fullBleed, 180, path.join(publicDir, 'apple-touch-icon.png'))
  await writePng(rounded, 192, path.join(publicDir, 'icons', 'icon-192.png'))
  await writePng(rounded, 512, path.join(publicDir, 'icons', 'icon-512.png'))
  await writePng(fullBleed, 512, path.join(publicDir, 'icons', 'icon-maskable-512.png'))
}

await main()
