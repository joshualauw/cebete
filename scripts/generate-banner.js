/**
 * One-time banner generator for cebete. It is a development tool, not part of the app:
 * nothing in `src/` imports it, and its output lives in `assets/`, never in `public/`,
 * so it is not shipped to users. The README shows it.
 *
 * It draws the banner as vector artwork: the app logo (with its colours inverted, so it
 * stands out on the band) beside the title "cebete" on a teal band. The lettering is built
 * from the same rounded strokes as the logo's ring, with no font and no text element, so it
 * looks identical everywhere.
 *
 * Re-run it only when the artwork changes:
 *
 *   npm run banner
 *
 * Output (all under assets/):
 *   banner.svg   The vector master
 *   banner.png   Twice the size of the SVG, for high-density screens (the README shows this)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const assetsDir = path.resolve(import.meta.dirname, '..', 'assets')

const WIDTH = 1200
const HEIGHT = 320
const SCALE = 2

const BAND = '#0f766e'
const PALE = '#f0fdfa'

// The logo is the icon artwork (512 units wide), drawn smaller and in inverted colours.
const ICON_VIEW = 512
const ICON_RING_RADIUS = 120
const ICON_RING_WIDTH = 44
const ICON_DOT_RADIUS = 24
const ICON_CORNER_RADIUS = 112
const ICON_GAP_HALF_ANGLE = 40
const TILE_SIZE = 176
const TILE_X = 96
const TILE_Y = 72

// The lettering: a round stroke, and letters built on one circle of this radius.
const STROKE = 22
const R = 44
const CENTER_Y = 188
const ASCENDER_TOP = 95
const GAP_HALF_ANGLE = 40 // the opening of the "c", as in the logo
const GAP = 24 // space between the outer edges of two letters
const TEXT_X = 340

function round(value) {
  return Math.round(value * 100) / 100
}

function onCircle(cx, cy, radius, angleDegrees) {
  const radians = (angleDegrees * Math.PI) / 180
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) }
}

function stroked(d) {
  return `<path d="${d}" fill="none" stroke="${PALE}" stroke-width="${STROKE}" stroke-linecap="round" stroke-linejoin="round"/>`
}

function letterC(cx) {
  const start = onCircle(cx, CENTER_Y, R, GAP_HALF_ANGLE)
  const end = onCircle(cx, CENTER_Y, R, -GAP_HALF_ANGLE)

  return stroked(
    `M ${round(start.x)} ${round(start.y)} A ${R} ${R} 0 1 1 ${round(end.x)} ${round(end.y)}`,
  )
}

function letterE(cx) {
  const end = onCircle(cx, CENTER_Y, R, GAP_HALF_ANGLE)

  return stroked(
    `M ${round(cx - R)} ${CENTER_Y} H ${round(cx + R)} A ${R} ${R} 0 1 0 ${round(end.x)} ${round(end.y)}`,
  )
}

function letterB(cx) {
  const stemX = round(cx - R)

  return [
    stroked(`M ${stemX} ${ASCENDER_TOP} V ${CENTER_Y}`),
    `<circle cx="${cx}" cy="${CENTER_Y}" r="${R}" fill="none" stroke="${PALE}" stroke-width="${STROKE}"/>`,
  ].join('\n    ')
}

function letterT(cx) {
  const top = CENTER_Y - R
  const bottom = CENTER_Y + R
  const hook = 40

  return [
    stroked(`M ${cx} 105 V ${bottom - hook} A ${hook} ${hook} 0 0 0 ${cx + hook} ${bottom}`),
    stroked(`M ${cx - 34} ${top} H ${cx + hook}`),
  ].join('\n    ')
}

// Each letter's half-width on either side of its centre (the outer edge includes the stroke).
const HALF = R + STROKE / 2
const LETTERS = [
  { draw: letterC, left: HALF, right: HALF },
  { draw: letterE, left: HALF, right: HALF },
  { draw: letterB, left: HALF, right: HALF },
  { draw: letterE, left: HALF, right: HALF },
  { draw: letterT, left: 34 + STROKE / 2, right: 40 + STROKE / 2 },
  { draw: letterE, left: HALF, right: HALF },
]

function buildLettering() {
  let edge = TEXT_X
  const shapes = []

  for (const letter of LETTERS) {
    const cx = edge + letter.left
    shapes.push(letter.draw(cx))
    edge = cx + letter.right + GAP
  }

  return shapes.join('\n    ')
}

function buildLogo() {
  const start = onCircle(ICON_VIEW / 2, ICON_VIEW / 2, ICON_RING_RADIUS, ICON_GAP_HALF_ANGLE)
  const end = onCircle(ICON_VIEW / 2, ICON_VIEW / 2, ICON_RING_RADIUS, -ICON_GAP_HALF_ANGLE)
  const scale = TILE_SIZE / ICON_VIEW

  return [
    `<g transform="translate(${TILE_X} ${TILE_Y}) scale(${round(scale * 10000) / 10000})">`,
    `    <rect width="${ICON_VIEW}" height="${ICON_VIEW}" rx="${ICON_CORNER_RADIUS}" fill="${PALE}"/>`,
    `    <path d="M ${round(start.x)} ${round(start.y)} A ${ICON_RING_RADIUS} ${ICON_RING_RADIUS} 0 1 1 ${round(end.x)} ${round(end.y)}" fill="none" stroke="${BAND}" stroke-width="${ICON_RING_WIDTH}" stroke-linecap="round"/>`,
    `    <circle cx="${ICON_VIEW / 2 + ICON_RING_RADIUS}" cy="${ICON_VIEW / 2}" r="${ICON_DOT_RADIUS}" fill="${BAND}"/>`,
    `  </g>`,
  ].join('\n')
}

function buildSvg() {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}" width="${WIDTH}" height="${HEIGHT}">`,
    `  <title>cebete</title>`,
    `  <rect width="${WIDTH}" height="${HEIGHT}" fill="${BAND}"/>`,
    `  ${buildLogo()}`,
    `  <g>`,
    `    ${buildLettering()}`,
    `  </g>`,
    `</svg>`,
    ``,
  ].join('\n')
}

async function main() {
  const svg = buildSvg()

  await mkdir(assetsDir, { recursive: true })

  await writeFile(path.join(assetsDir, 'banner.svg'), svg)
  console.log('wrote banner.svg')

  await sharp(Buffer.from(svg), { density: 72 * SCALE })
    .resize(WIDTH * SCALE, HEIGHT * SCALE)
    .png()
    .toFile(path.join(assetsDir, 'banner.png'))
  console.log(`wrote banner.png (${WIDTH * SCALE}x${HEIGHT * SCALE})`)
}

await main()
