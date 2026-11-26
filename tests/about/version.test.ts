// @vitest-environment node
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { APP_VERSION } from '@/about/version'

describe('APP_VERSION', () => {
  it('is the version in package.json, the one single place it is set', () => {
    const manifest: unknown = JSON.parse(
      readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'),
    )

    expect(manifest).toMatchObject({ version: APP_VERSION })
  })

  it('is a real version number', () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })
})
