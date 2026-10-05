import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/getById.js', () => ({ getById: vi.fn() }))

const ASSET_ID = '73a385f5-728d-42a8-ab2b-1646ad103dc0'

async function buildApp(user?: { email: string; role: string }) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  // Stand-in for the real authenticate hook: sets request.user for the test.
  app.addHook('onRequest', async request => {
    request.user = user
  })
  const { getAssetById } = await import('./getById.js')
  await app.register(getAssetById)
  await app.ready()
  return app
}

describe('GET /assetWith/:id role guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin gets 200', async () => {
    const { getById } = await import('../services/getById.js')
    vi.mocked(getById).mockResolvedValue({ asset: [] })
    const app = await buildApp({ email: 'admin@mastertech.ie', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: `/assetWith/${ASSET_ID}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ assetDetails: [] })
    expect(getById).toHaveBeenCalledTimes(1)
    await app.close()
  })

  it.each(['staff', 'viewer', 'hr', 'hs_officer', 'dept_manager'])(
    '%s gets 403 AUTHORIZATION_ERROR and the service is not called',
    async role => {
      const { getById } = await import('../services/getById.js')
      const app = await buildApp({ email: 'user@mastertech.ie', role })

      const response = await app.inject({
        method: 'GET',
        url: `/assetWith/${ASSET_ID}`,
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(getById).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('no user gets 403 AUTHORIZATION_ERROR and the service is not called', async () => {
    const { getById } = await import('../services/getById.js')
    const app = await buildApp(undefined)

    const response = await app.inject({
      method: 'GET',
      url: `/assetWith/${ASSET_ID}`,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(getById).not.toHaveBeenCalled()
    await app.close()
  })
})
