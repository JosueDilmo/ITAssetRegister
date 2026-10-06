import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const webRoot = join(__dirname, '..')
const srcRoot = join(webRoot, 'src')
const authSrc = readFileSync(join(srcRoot, 'shared/lib/auth.ts'), 'utf8')

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(full)
    if (!/\.tsx?$/.test(entry.name)) return []
    if (full === join(srcRoot, 'http/api.ts')) return []
    return [full]
  })
}

describe('session lifetime (ACC-04, D-04)', () => {
  it('caps the jwt session at an absolute 8 hours', () => {
    expect(authSrc).toMatch(
      /session:\s*\{\s*strategy:\s*'jwt',\s*maxAge:\s*8 \* 60 \* 60/
    )
  })

  it('lists site_supervisor among the roles', () => {
    expect(authSrc).toContain('site_supervisor')
  })

  it('session is not renewed by a client provider', () => {
    const files = sourceFiles(srcRoot)
    expect(files.length).toBeGreaterThan(0)
    const offenders = files.filter(f => {
      const src = readFileSync(f, 'utf8')
      return (
        src.includes('next-auth/react') || src.includes('/api/auth/session')
      )
    })
    expect(offenders).toEqual([])
  })

  it('no middleware refreshes the session', () => {
    expect(existsSync(join(webRoot, 'middleware.ts'))).toBe(false)
    expect(existsSync(join(srcRoot, 'middleware.ts'))).toBe(false)
  })
})
