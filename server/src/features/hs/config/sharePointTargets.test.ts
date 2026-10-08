import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { ExternalServiceError } from '../../../errors/errorTypes.js'

const configuredEnv = {
  HS_ME_SITE_ID: 'me-site',
  HS_ME_DRIVE_ID: 'me-drive',
  HS_QHSE_SITE_ID: 'qhse-site',
  HS_QHSE_PREAPPROVED_DRIVE_ID: 'pre-drive',
  HS_QHSE_CONTROL_DRIVE_ID: 'ctl-drive',
  HS_ME_PROJECTS_ROOT: '01_Proj/Open',
  HS_ME_PROJECT_HS_PATH: '1. Cons/5. H&S',
  HS_ME_PERMITS_FOLDER: 'Permits',
  HS_QHSE_PREAPPROVED_ROOT: '',
  HS_QHSE_CONTROL_ROOT: '',
}

async function loadTargetsWith(hsEnv: object, hsConfigured: boolean) {
  vi.resetModules()
  vi.doMock('../../../hsEnv.js', () => ({ hsEnv, hsConfigured }))
  // Load every module after the reset so error classes share one identity
  // (errorHandler uses instanceof AppError).
  const targets = await import('./sharePointTargets.js')
  const errors = await import('../../../errors/index.js')
  return { ...targets, ...errors }
}

describe('getSharePointTargets', () => {
  afterEach(() => {
    vi.doUnmock('../../../hsEnv.js')
    vi.doUnmock('../../../env.js')
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns typed targets with defaults when all five IDs are configured', async () => {
    const { getSharePointTargets } = await loadTargetsWith(configuredEnv, true)

    expect(getSharePointTargets()).toEqual({
      me: {
        siteId: 'me-site',
        driveId: 'me-drive',
        projectsRoot: '01_Proj/Open',
        projectHsPath: '1. Cons/5. H&S',
        permitsFolder: 'Permits',
      },
      qhse: {
        siteId: 'qhse-site',
        preapproved: { driveId: 'pre-drive', root: '' },
        control: { driveId: 'ctl-drive', root: '' },
      },
    })
  })

  it('throws HsNotConfiguredError (503 HS_NOT_CONFIGURED) when unconfigured', async () => {
    const { getSharePointTargets, HsNotConfiguredError } =
      await loadTargetsWith({}, false)

    expect(() => getSharePointTargets()).toThrow(HsNotConfiguredError)
    expect.assertions(4)
    try {
      getSharePointTargets()
    } catch (error) {
      expect(
        (error as InstanceType<typeof HsNotConfiguredError>).statusCode
      ).toBe(503)
      expect((error as InstanceType<typeof HsNotConfiguredError>).code).toBe(
        'HS_NOT_CONFIGURED'
      )
      expect(error).toBeInstanceOf(HsNotConfiguredError)
    }
  })

  it('answers 503 HS_NOT_CONFIGURED over HTTP through errorHandler', async () => {
    const { getSharePointTargets, errorHandler } = await loadTargetsWith(
      {},
      false
    )

    const errorBody = z.object({
      success: z.literal(false),
      error: z.object({
        code: z.string(),
        message: z.string(),
        details: z.unknown().nullable(),
      }),
    })
    const app = Fastify()
    app.setValidatorCompiler(validatorCompiler)
    app.setSerializerCompiler(serializerCompiler)
    app.setErrorHandler(errorHandler)
    app.get(
      '/probe',
      { schema: { response: { 200: z.unknown(), 503: errorBody } } },
      async () => getSharePointTargets()
    )

    const response = await app.inject({ method: 'GET', url: '/probe' })
    await app.close()

    expect(response.statusCode).toBe(503)
    expect(response.json().success).toBe(false)
    expect(response.json().error.code).toBe('HS_NOT_CONFIGURED')
  })

  it('real hsEnv with no HS_* values is unconfigured and carries the defaults', async () => {
    vi.resetModules()
    vi.doMock('../../../env.js', () => ({ env: {} }))
    for (const key of Object.keys(configuredEnv)) {
      vi.stubEnv(key, undefined)
    }
    const real = await import('../../../hsEnv.js')

    expect(real.hsConfigured).toBe(false)
    expect(real.hsEnv.HS_ME_PROJECTS_ROOT).toBe('01_Proj/Open')
    expect(real.hsEnv.HS_ME_PROJECT_HS_PATH).toBe('1. Cons/5. H&S')
    expect(real.hsEnv.HS_ME_PERMITS_FOLDER).toBe('Permits')
  })
})

describe('ExternalServiceError', () => {
  it('is a 503 EXTERNAL_SERVICE_ERROR', () => {
    const error = new ExternalServiceError('x')
    expect(error.statusCode).toBe(503)
    expect(error.code).toBe('EXTERNAL_SERVICE_ERROR')
  })
})
