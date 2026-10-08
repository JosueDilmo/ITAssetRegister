import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/getByStaff.js', () => ({ getByStaff: vi.fn() }))

const EMAIL = 'jane@mastertech.ie'

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
  const { getAssetsByStaff } = await import('./getByStaff.js')
  await app.register(getAssetsByStaff)
  await app.ready()
  return app
}

describe('GET /assetByStaff/:email role guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin gets 200', async () => {
    const { getByStaff } = await import('../services/getByStaff.js')
    vi.mocked(getByStaff).mockResolvedValue({
      success: true,
      message: 'ok',
      assetList: [],
    })
    const app = await buildApp({ email: 'admin@mastertech.ie', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: `/assetByStaff/${EMAIL}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      success: true,
      message: 'ok',
      assetList: [],
    })
    expect(getByStaff).toHaveBeenCalledWith({
      staffEmail: 'jane@mastertech.ie',
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
      const { getByStaff } = await import('../services/getByStaff.js')
      const app = await buildApp({ email: 'user@mastertech.ie', role })

      const response = await app.inject({
        method: 'GET',
        url: `/assetByStaff/${EMAIL}`,
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(getByStaff).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('no user gets 403 AUTHORIZATION_ERROR and the service is not called', async () => {
    const { getByStaff } = await import('../services/getByStaff.js')
    const app = await buildApp(undefined)

    const response = await app.inject({
      method: 'GET',
      url: `/assetByStaff/${EMAIL}`,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(getByStaff).not.toHaveBeenCalled()
    await app.close()
  })
})
