// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

const root = process.cwd()
const readme = readFileSync(path.join(root, 'README.md'), 'utf8')

function scriptNames(): readonly string[] {
  const manifest: unknown = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))

  if (
    typeof manifest === 'object' &&
    manifest !== null &&
    'scripts' in manifest &&
    typeof manifest.scripts === 'object' &&
    manifest.scripts !== null
  ) {
    return Object.keys(manifest.scripts)
  }

  return []
}

describe('README.md: what it tells a visitor', () => {
  it('names cebete in its banner, which is the title', () => {
    expect(readme).toMatch(/^!\[cebete\]\(assets\/banner\.png\)$/m)
  })

  it('says what the app does', () => {
    for (const feature of ['Mood log', 'Thought records', 'Coping library', 'summary', 'Backup']) {
      expect(readme).toContain(feature)
    }
  })

  it('makes the privacy promise', () => {
    expect(readme).toMatch(/stays in your browser/i)
    expect(readme).toMatch(/no analytics/i)
    expect(readme).toMatch(/backup files are plain text/i)
  })

  it('says it is a self-help tool and not medical advice', () => {
    expect(readme).toMatch(/self-help tool/i)
    expect(readme).toMatch(/not medical advice/i)
  })

  it('says the web address is the identity of the data', () => {
    expect(readme).toMatch(/different web address starts empty|different address starts empty/i)
    expect(readme).toMatch(/export a backup first/i)
  })

  it('credits the book it draws on, with every author, before the licence', () => {
    expect(readme).toMatch(/^## Inspired by$/m)
    expect(readme).toContain(
      'CBT Toolbox for Children & Adolescents: Over 200 Worksheets & Exercises for Trauma, ADHD, Autism, Anxiety, Depression & Conduct Disorders',
    )

    for (const author of [
      'Lisa Weed Phifer',
      'Amanda K. Crowder',
      'Tracy Elsenraat',
      'Robert Hull',
    ]) {
      expect(readme).toContain(author)
    }

    expect(readme.indexOf('## Inspired by')).toBeLessThan(readme.indexOf('## Licence'))
  })

  it('says it is independent, not affiliated with or endorsed by the authors or the publisher', () => {
    expect(readme).toMatch(/independent project/i)
    expect(readme).toMatch(/not affiliated with or endorsed by the authors or the publisher/i)
  })

  it('names the licence and points at the file, which exists', () => {
    expect(readme).toContain('MIT')
    expect(readme).toContain('(LICENSE)')
    expect(existsSync(path.join(root, 'LICENSE'))).toBe(true)
  })
})

describe('README.md: how to run it', () => {
  it('names only npm scripts that exist', () => {
    const scripts = scriptNames()
    const named = [...readme.matchAll(/npm run ([\w:-]+)/g)].map((match) => match[1])

    expect(named.length).toBeGreaterThan(0)

    for (const name of named) {
      expect(scripts).toContain(name)
    }
  })

  it('covers install, start, build and the five checks', () => {
    for (const command of [
      'npm install',
      'npm run dev',
      'npm run build',
      'npm run preview',
      'npm run typecheck',
      'npm run format',
      'npm run lint',
      'npm test',
    ]) {
      expect(readme).toContain(command)
    }
  })

  it('asks for the Node version the project needs', () => {
    expect(readme).toContain('Node.js 22.12')
  })
})

describe('README.md: what it leaves out', () => {
  it('holds no web address, so no repository link and no hosted-app link', () => {
    expect(readme).not.toMatch(/https?:\/\//i)
    expect(readme).not.toMatch(/\bwww\./i)
    expect(readme).not.toMatch(/github\.com|vercel\.app/i)
  })

  it('holds no email address', () => {
    expect(readme).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/)
  })
})
