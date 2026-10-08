import { afterEach, describe, expect, it, vi } from 'vitest'

// The side-effect import in hsEnv.ts must never parse the base schema in tests.
vi.mock('./env.js', () => ({ env: {} }))

const ALL_IDS = {
  HS_ME_SITE_ID: 'me-site',
  HS_ME_DRIVE_ID: 'me-drive',
  HS_QHSE_SITE_ID: 'qhse-site',
  HS_QHSE_PREAPPROVED_DRIVE_ID: 'pre-drive',
  HS_QHSE_CONTROL_DRIVE_ID: 'ctl-drive',
}

const HS_KEYS = [
  ...Object.keys(ALL_IDS),
  'HS_ME_PROJECTS_ROOT',
  'HS_ME_PROJECT_HS_PATH',
  'HS_ME_PERMITS_FOLDER',
  'HS_QHSE_PREAPPROVED_ROOT',
  'HS_QHSE_CONTROL_ROOT',
]

describe('hsEnvSchema', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('parses with no HS keys: not configured, defaults applied', async () => {
    const { hsEnvSchema, isHsConfigured } = await import('./hsEnv.js')
    const result = hsEnvSchema.safeParse({})

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(isHsConfigured(result.data)).toBe(false)
    expect(result.data.HS_ME_PROJECTS_ROOT).toBe('01_Proj/Open')
    expect(result.data.HS_ME_PROJECT_HS_PATH).toBe('1. Cons/5. H&S')
    expect(result.data.HS_ME_PERMITS_FOLDER).toBe('Permits')
  })

  it('parses with all five IDs: configured', async () => {
    const { hsEnvSchema, isHsConfigured } = await import('./hsEnv.js')
    const result = hsEnvSchema.safeParse(ALL_IDS)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(isHsConfigured(result.data)).toBe(true)
  })

  it('fails with one issue per missing key when only HS_ME_SITE_ID is set', async () => {
    const { hsEnvSchema } = await import('./hsEnv.js')
    const result = hsEnvSchema.safeParse({ HS_ME_SITE_ID: 'x' })

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toHaveLength(4)
    expect(result.error.issues.map(i => i.path[0]).sort()).toEqual([
      'HS_ME_DRIVE_ID',
      'HS_QHSE_CONTROL_DRIVE_ID',
      'HS_QHSE_PREAPPROVED_DRIVE_ID',
      'HS_QHSE_SITE_ID',
    ])
    for (const issue of result.error.issues) {
      expect(issue.message).toContain('all-or-nothing')
    }
  })

  it('fails with a single issue when four IDs are set', async () => {
    const { hsEnvSchema } = await import('./hsEnv.js')
    const { HS_QHSE_CONTROL_DRIVE_ID: _omitted, ...fourIds } = ALL_IDS
    const result = hsEnvSchema.safeParse(fourIds)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.error.issues).toHaveLength(1)
    expect(result.error.issues[0].path).toEqual(['HS_QHSE_CONTROL_DRIVE_ID'])
  })

  it('treats empty-string IDs as unset: parses and is not configured', async () => {
    const { hsEnvSchema, isHsConfigured } = await import('./hsEnv.js')
    const empties = Object.fromEntries(Object.keys(ALL_IDS).map(k => [k, '']))
    const result = hsEnvSchema.safeParse(empties)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(isHsConfigured(result.data)).toBe(false)
  })

  it('treats blank defaulted path vars as unset so the default applies', async () => {
    const { hsEnvSchema } = await import('./hsEnv.js')
    const result = hsEnvSchema.safeParse({
      HS_ME_PROJECTS_ROOT: '',
      HS_ME_PROJECT_HS_PATH: '   ',
      HS_ME_PERMITS_FOLDER: '',
    })

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.HS_ME_PROJECTS_ROOT).toBe('01_Proj/Open')
    expect(result.data.HS_ME_PROJECT_HS_PATH).toBe('1. Cons/5. H&S')
    expect(result.data.HS_ME_PERMITS_FOLDER).toBe('Permits')
  })

  it('boots (import resolves) with blank defaulted path vars in process.env', async () => {
    for (const key of HS_KEYS) vi.stubEnv(key, undefined)
    vi.stubEnv('HS_ME_PROJECTS_ROOT', '')
    vi.stubEnv('HS_ME_PERMITS_FOLDER', '')
    vi.resetModules()

    const { hsEnv } = await import('./hsEnv.js')
    expect(hsEnv.HS_ME_PROJECTS_ROOT).toBe('01_Proj/Open')
    expect(hsEnv.HS_ME_PERMITS_FOLDER).toBe('Permits')
  })

  it.each([
    '/01_Proj/Open/',
    '/01_Proj/Open',
    '01_Proj/Open/',
    '01_Proj//Open',
    '01_Proj/../Open',
    './Open',
  ])('rejects malformed folder path %j at boot', async bad => {
    const { hsEnvSchema } = await import('./hsEnv.js')

    for (const key of [
      'HS_ME_PROJECTS_ROOT',
      'HS_ME_PROJECT_HS_PATH',
      'HS_ME_PERMITS_FOLDER',
      'HS_QHSE_PREAPPROVED_ROOT',
      'HS_QHSE_CONTROL_ROOT',
    ]) {
      expect(hsEnvSchema.safeParse({ [key]: bad }).success).toBe(false)
    }
  })

  it('accepts well-formed nested paths and an empty QHSE root', async () => {
    const { hsEnvSchema } = await import('./hsEnv.js')
    const result = hsEnvSchema.safeParse({
      HS_ME_PROJECTS_ROOT: 'A/B c/D',
      HS_QHSE_PREAPPROVED_ROOT: '',
      HS_QHSE_CONTROL_ROOT: 'Control docs',
    })

    expect(result.success).toBe(true)
  })

  it('refuses to boot (import rejects) when only HS_ME_SITE_ID is in process.env', async () => {
    for (const key of HS_KEYS) vi.stubEnv(key, undefined)
    vi.stubEnv('HS_ME_SITE_ID', 'x')
    vi.resetModules()

    await expect(import('./hsEnv.js')).rejects.toThrow()
  })

  it('boots with hsConfigured false when no HS_* env is set', async () => {
    for (const key of HS_KEYS) vi.stubEnv(key, undefined)
    vi.resetModules()

    const { hsConfigured } = await import('./hsEnv.js')
    expect(hsConfigured).toBe(false)
  })
})
