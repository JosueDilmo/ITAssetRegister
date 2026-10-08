import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/getBySerial.js', () => ({ getBySerial: vi.fn() }))

const SERIAL = 'SN-0001'

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
  const { getAssetBySerial } = await import('./getBySerial.js')
  await app.register(getAssetBySerial)
  await app.ready()
  return app
}

describe('GET /assetBySerial/:serialNumber role guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin gets 200', async () => {
    const { getBySerial } = await import('../services/getBySerial.js')
    vi.mocked(getBySerial).mockResolvedValue({
      success: true,
      message: 'ok',
      assetDetails: [],
    })
    const app = await buildApp({ email: 'admin@mastertech.ie', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: `/assetBySerial/${SERIAL}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      success: true,
      message: 'ok',
      assetDetails: [],
    })
    expect(getBySerial).toHaveBeenCalledTimes(1)
    expect(getBySerial).toHaveBeenCalledWith({ serialNumber: SERIAL })
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
      const { getBySerial } = await import('../services/getBySerial.js')
      const app = await buildApp({ email: 'user@mastertech.ie', role })

      const response = await app.inject({
        method: 'GET',
        url: `/assetBySerial/${SERIAL}`,
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(getBySerial).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('no user gets 403 AUTHORIZATION_ERROR and the service is not called', async () => {
    const { getBySerial } = await import('../services/getBySerial.js')
    const app = await buildApp(undefined)

    const response = await app.inject({
      method: 'GET',
      url: `/assetBySerial/${SERIAL}`,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(getBySerial).not.toHaveBeenCalled()
    await app.close()
  })
})
