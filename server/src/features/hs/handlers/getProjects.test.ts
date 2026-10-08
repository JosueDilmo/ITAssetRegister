import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../shared/services/graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok'),
  clearGraphTokenCache: vi.fn(),
}))
vi.mock('../../../shared/services/graphDriveClient.js', () => ({
  listChildren: vi.fn(),
}))
vi.mock('../config/sharePointTargets.js', () => ({
  getSharePointTargets: vi.fn(),
}))

const TARGETS = {
  me: {
    siteId: 'site-me',
    driveId: 'drive-me',
    projectsRoot: '01_Proj/Open',
    projectHsPath: '1. Cons/5. H&S',
    permitsFolder: 'Permits',
  },
  qhse: {
    siteId: 'site-qhse',
    preapproved: { driveId: 'd-pre', root: '' },
    control: { driveId: 'd-ctl', root: '' },
  },
}

const NAMES = {
  silver: 'PR1913 EMS - Silver Stream & Trinity Care',
  lower: 'pr1234 x',
  doubleSpace: 'PR1982  DRT DUB 13 Dehumidifiers',
  apostrophe: "PR1983 St. Andrew's",
  pricing: 'Pricing',
}

function folder(id: string, name: string) {
  return {
    id,
    name,
    webUrl: `https://sp.example/${id}`,
    folder: { childCount: 1 },
  }
}

const FIXTURE = [
  folder('i-1913', NAMES.silver),
  folder('i-1234', NAMES.lower),
  folder('i-1982', NAMES.doubleSpace),
  folder('i-1983', NAMES.apostrophe),
  folder('i-pricing', NAMES.pricing),
  folder('i-smoke', '_hs-smoke-20261006-ab12'),
  {
    id: 'i-file',
    name: 'PR1999 notes.docx',
    webUrl: 'https://sp.example/i-file',
    file: { mimeType: 'application/octet-stream' },
  },
]

async function buildApp(user?: {
  email: string
  role: string
  roles?: string[]
}) {
  // Imported after vi.resetModules so AppError identity matches the service's.
  const { errorHandler } = await import('../../../errors/index.js')
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  // Stand-in for the real authenticate hook: sets request.user for the test.
  app.addHook('onRequest', async request => {
    request.user = user
      ? { ...user, roles: user.roles ?? [user.role] }
      : undefined
  })
  const { hsRoutes } = await import('../routes.js')
  await app.register(hsRoutes, { prefix: '/api' })
  await app.ready()
  return app
}

async function mocks() {
  const { listChildren } = await import(
    '../../../shared/services/graphDriveClient.js'
  )
  const { getSharePointTargets } = await import(
    '../config/sharePointTargets.js'
  )
  const { GraphError } = await import('../../../shared/services/graphFetch.js')
  return { listChildren, getSharePointTargets, GraphError }
}

describe('GET /api/hs/projects', () => {
  beforeEach(async () => {
    // Fresh module state (cache) for every test.
    vi.resetModules()
    vi.restoreAllMocks()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { listChildren, getSharePointTargets } = await mocks()
    vi.mocked(listChildren).mockReset()
    vi.mocked(getSharePointTargets).mockReset()
    vi.mocked(getSharePointTargets).mockReturnValue(TARGETS)
  })

  it.each([
    { role: 'site_supervisor', roles: undefined },
    { role: 'hs_officer', roles: undefined },
    { role: 'admin', roles: undefined },
    { role: 'hr', roles: ['hr', 'site_supervisor'] },
  ])('$role ($roles) gets 200 with the PR folders only', async user => {
    const { listChildren } = await mocks()
    vi.mocked(listChildren).mockResolvedValue(FIXTURE)
    const app = await buildApp({ email: 'u@mastertech.ie', ...user })

    const response = await app.inject({
      method: 'GET',
      url: '/api/hs/projects',
    })

    expect(response.statusCode).toBe(200)
    const body = response.json()
    expect(body.stale).toBe(false)
    expect(new Date(body.cachedAt).toISOString()).toBe(body.cachedAt)
    // sorted by name; 'Pricing' is a PR-prefixed folder per D-18
    expect(body.projects.map((p: { name: string }) => p.name)).toEqual([
      NAMES.lower,
      NAMES.silver,
      NAMES.doubleSpace,
      NAMES.apostrophe,
      NAMES.pricing,
    ])
    expect(body.projects.map((p: { code: string }) => p.code)).toEqual([
      'PR1234',
      'PR1913',
      'PR1982',
      'PR1983',
      'PRICING',
    ])
    // D-15: raw names, byte for byte (double space preserved)
    expect(body.projects[2].name).toBe('PR1982  DRT DUB 13 Dehumidifiers')
    expect(body.projects[2].name).toContain('  ')
    expect(body.projects[1]).toEqual({
      id: 'i-1913',
      name: NAMES.silver,
      code: 'PR1913',
      webUrl: 'https://sp.example/i-1913',
    })
    expect(listChildren).toHaveBeenCalledTimes(1)
    expect(listChildren).toHaveBeenCalledWith('drive-me', {
      path: '01_Proj/Open',
    })
    await app.close()
  })

  it.each(['staff', 'viewer', 'hr', 'dept_manager'])(
    '%s gets 403 AUTHORIZATION_ERROR and SharePoint is not called',
    async role => {
      const { listChildren, getSharePointTargets } = await mocks()
      const app = await buildApp({ email: 'u@mastertech.ie', role })

      const response = await app.inject({
        method: 'GET',
        url: '/api/hs/projects',
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(listChildren).not.toHaveBeenCalled()
      expect(getSharePointTargets).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('an unauthenticated request gets 403 and SharePoint is not called', async () => {
    const { listChildren } = await mocks()
    const app = await buildApp(undefined)

    const response = await app.inject({
      method: 'GET',
      url: '/api/hs/projects',
    })

    expect(response.statusCode).toBe(403)
    expect(listChildren).not.toHaveBeenCalled()
    await app.close()
  })

  it('answers 503 HS_NOT_CONFIGURED when the H&S env group is unset', async () => {
    const { getSharePointTargets, listChildren } = await mocks()
    const { HsNotConfiguredError } = await import('../../../errors/index.js')
    vi.mocked(getSharePointTargets).mockImplementation(() => {
      throw new HsNotConfiguredError()
    })
    const app = await buildApp({ email: 'a@mastertech.ie', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/hs/projects',
    })

    expect(response.statusCode).toBe(503)
    expect(response.json().error.code).toBe('HS_NOT_CONFIGURED')
    expect(listChildren).not.toHaveBeenCalled()
    await app.close()
  })

  it('answers 503 EXTERNAL_SERVICE_ERROR without Graph details when SharePoint fails and nothing is cached', async () => {
    const { listChildren, GraphError } = await mocks()
    vi.mocked(listChildren).mockRejectedValue(
      new GraphError(503, 'serviceNotAvailable', 'req-1', true)
    )
    const app = await buildApp({ email: 'a@mastertech.ie', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/hs/projects',
    })

    expect(response.statusCode).toBe(503)
    expect(response.json().error.code).toBe('EXTERNAL_SERVICE_ERROR')
    expect(response.body).not.toContain('serviceNotAvailable')
    expect(response.body).not.toContain('req-1')
    await app.close()
  })

  it('an empty Open folder gives 200 with an empty list', async () => {
    const { listChildren } = await mocks()
    vi.mocked(listChildren).mockResolvedValue([])
    const app = await buildApp({ email: 'a@mastertech.ie', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: '/api/hs/projects',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ projects: [], stale: false })
    await app.close()
  })
})
