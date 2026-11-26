// @vitest-environment node
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const root = process.cwd()

function readText(file: string): string {
  return readFileSync(path.join(root, file), 'utf8')
}

describe('LICENSE', () => {
  const text = readText('LICENSE')

  it('is the MIT licence in the name of Joshua William, for 2026', () => {
    expect(text.startsWith('MIT License')).toBe(true)
    expect(text).toContain('Copyright (c) 2026 Joshua William')
    expect(text).toContain('Permission is hereby granted, free of charge')
    expect(text).toContain('THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND')
  })

  it('ends with a newline', () => {
    expect(text.endsWith('\n')).toBe(true)
  })
})

describe('.gitignore: the book PDF', () => {
  const text = readText('.gitignore')

  it('lists the PDF', () => {
    expect(text.split(/\r?\n/)).toContain('CBT_Printed_Version.pdf')
  })

  it('makes git ignore the PDF, whether or not the file is there', () => {
    const ignored = execFileSync('git', ['check-ignore', 'CBT_Printed_Version.pdf'], {
      cwd: root,
      encoding: 'utf8',
    })

    expect(ignored.trim()).toBe('CBT_Printed_Version.pdf')
  })

  it('keeps its earlier entries and its final newline', () => {
    const lines = text.split(/\r?\n/)

    for (const entry of ['node_modules', 'dist', '.env', '.vercel']) {
      expect(lines).toContain(entry)
    }

    expect(text.endsWith('\n')).toBe(true)
  })
})
