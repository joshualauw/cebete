// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const root = process.cwd()
const svg = readFileSync(path.join(root, 'assets', 'banner.svg'), 'utf8')
const png = readFileSync(path.join(root, 'assets', 'banner.png'))
const readme = readFileSync(path.join(root, 'README.md'), 'utf8')

describe('the banner files', () => {
  it('exist where the README looks for them', () => {
    expect(existsSync(path.join(root, 'assets', 'banner.svg'))).toBe(true)
    expect(existsSync(path.join(root, 'assets', 'banner.png'))).toBe(true)
  })

  it('draw the lettering from shapes, with no text, no script and no outside address', () => {
    expect(svg).not.toMatch(/<text\b/i)
    expect(svg).not.toMatch(/<script\b/i)
    expect(svg).not.toMatch(/<image\b/i)
    expect(svg).not.toMatch(/https?:\/\/(?!www\.w3\.org\/2000\/svg)/i)
    expect(svg).not.toMatch(/font/i)
  })

  it('use the brand teal for the band, with the logo and title in pale teal', () => {
    expect(svg).toContain('#0f766e')
    expect(svg).toContain('#f0fdfa')
    expect(svg).toContain('<title>cebete</title>')
  })

  it('is a real PNG, twice the size of the SVG, in a wide banner shape', () => {
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    const width = png.readUInt32BE(16)
    const height = png.readUInt32BE(20)
    const view = /viewBox="0 0 (\d+) (\d+)"/.exec(svg)

    expect(view).not.toBeNull()
    expect(width).toBe(Number(view?.[1]) * 2)
    expect(height).toBe(Number(view?.[2]) * 2)
    expect(width / height).toBeGreaterThan(3)
  })
})

describe('the banner in the README', () => {
  it('is the first thing in the README, with "cebete" as its alternative text', () => {
    expect(readme.startsWith('![cebete](assets/banner.png)')).toBe(true)
  })

  it('is an image from a path inside the repository, not a link or an address', () => {
    expect(readme).not.toMatch(/\[!\[/)
    expect(readme).not.toMatch(/https?:\/\//i)
  })
})

describe('the banner is not shipped', () => {
  it('lives outside the public folder, so the build never copies it', () => {
    expect(existsSync(path.join(root, 'public', 'banner.png'))).toBe(false)
    expect(existsSync(path.join(root, 'public', 'banner.svg'))).toBe(false)
    expect(existsSync(path.join(root, 'public', 'assets'))).toBe(false)
  })

  it('is not in the production build', () => {
    expect(existsSync(path.join(root, 'dist', 'banner.png'))).toBe(false)
    expect(existsSync(path.join(root, 'dist', 'assets', 'banner.png'))).toBe(false)
  })
})
