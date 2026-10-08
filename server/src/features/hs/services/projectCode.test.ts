import { describe, expect, it } from 'vitest'
import { deriveProjectCode } from './projectCode.js'

const INVALID_CHARS = /["*:<>?/\\|#%]/

describe('deriveProjectCode', () => {
  it.each([
    ['PR1913 EMS - Silver Stream & Trinity Care', 'PR1913'],
    ['PR1985 Dub13&14 Foul Monitoring', 'PR1985'],
    ['PR1925 St. Manchans Mohil', 'PR1925'],
    ["PR1983 St. Andrew's", 'PR1983'],
    ['PR1982  DRT DUB 13 Dehumidifiers', 'PR1982'],
    ['PR1993', 'PR1993'],
  ])('derives the PR prefix from %j', (name, code) => {
    expect(deriveProjectCode(name)).toEqual({ code, fromPrefix: true })
  })

  it('upper-cases the prefix (D-25)', () => {
    expect(deriveProjectCode('pr1234 x')).toEqual({
      code: 'PR1234',
      fromPrefix: true,
    })
  })

  it('falls back to the upper-cased name when there is no PR<digits> prefix', () => {
    expect(deriveProjectCode('Pricing')).toEqual({
      code: 'PRICING',
      fromPrefix: false,
    })
  })

  it('collapses whitespace in the fallback', () => {
    expect(deriveProjectCode('PR 1234  Foo')).toEqual({
      code: 'PR 1234 FOO',
      fromPrefix: false,
    })
  })

  it('replaces SharePoint-invalid characters in the fallback', () => {
    expect(deriveProjectCode('a:b*c')).toEqual({
      code: 'A-B-C',
      fromPrefix: false,
    })
  })

  it('strips a trailing dot and a leading tilde', () => {
    expect(deriveProjectCode('Foo.').code).toBe('FOO')
    expect(deriveProjectCode('~Foo').code).toBe('FOO')
  })

  it('throws when the name has no usable characters', () => {
    expect(() => deriveProjectCode('   ')).toThrow(/no usable characters/)
  })

  it('never returns a SharePoint-invalid character', () => {
    for (const name of [
      'a"b',
      'a*b',
      'a:b',
      'a<b>',
      'a?b',
      'a/b\\c',
      'a|b#c%d',
    ]) {
      expect(deriveProjectCode(name).code).not.toMatch(INVALID_CHARS)
    }
  })

  it('derives from the NFC-normalised name', () => {
    const decomposed = 'Café'
    expect(deriveProjectCode(decomposed).code).toBe('CAFÉ')
  })
})
