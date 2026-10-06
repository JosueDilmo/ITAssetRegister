import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/getAll.js', () => ({ getAll: vi.fn() }))

async function buildApp(user?: {
  email: string
  role: string
  roles?: string[]
}) {
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
  const { getAllAssets } = await import('./getAll.js')
  await app.register(getAllAssets)
  await app.ready()
  return app
}

describe('GET /allAssets role guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin gets 200', async () => {
    const { getAll } = await import('../services/getAll.js')
    vi.mocked(getAll).mockResolvedValue({ assetList: [], total: 0 })
    const app = await buildApp({ email: 'admin@mastertech.ie', role: 'admin' })

    const response = await app.inject({ method: 'GET', url: '/allAssets' })

    expect(response.statusCode).toBe(200)
    expect(response.json().total).toBe(0)
    expect(getAll).toHaveBeenCalledTimes(1)
    expect(getAll).toHaveBeenCalledWith({
      search: undefined,
      page: 1,
      limit: 25,
    })
    await app.close()
  })

  it.each([
    'staff',
    'viewer',
    'hr',
    'hs_officer',
    'dept_manager',
    'site_supervisor',
  ])(
    '%s gets 403 AUTHORIZATION_ERROR and the service is not called',
    async role => {
      const { getAll } = await import('../services/getAll.js')
      const app = await buildApp({ email: 'user@mastertech.ie', role })

      const response = await app.inject({ method: 'GET', url: '/allAssets' })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(getAll).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('a hr + site_supervisor user gets 403 AUTHORIZATION_ERROR and the service is not called (D-02)', async () => {
    const { getAll } = await import('../services/getAll.js')
    const app = await buildApp({
      email: 'user@mastertech.ie',
      role: 'hr',
      roles: ['hr', 'site_supervisor'],
    })

    const response = await app.inject({ method: 'GET', url: '/allAssets' })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(getAll).not.toHaveBeenCalled()
    await app.close()
  })

  it('a hs_officer + admin user gets 200', async () => {
    const { getAll } = await import('../services/getAll.js')
    vi.mocked(getAll).mockResolvedValue({ assetList: [], total: 0 })
    const app = await buildApp({
      email: 'admin@mastertech.ie',
      role: 'admin',
      roles: ['hs_officer', 'admin'],
    })

    const response = await app.inject({ method: 'GET', url: '/allAssets' })

    expect(response.statusCode).toBe(200)
    await app.close()
  })

  it('no user gets 403 AUTHORIZATION_ERROR and the service is not called', async () => {
    const { getAll } = await import('../services/getAll.js')
    const app = await buildApp(undefined)

    const response = await app.inject({ method: 'GET', url: '/allAssets' })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(getAll).not.toHaveBeenCalled()
    await app.close()
  })
})
