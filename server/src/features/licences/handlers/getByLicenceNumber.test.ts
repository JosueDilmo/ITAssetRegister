import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/getByLicenceNumber.js', () => ({
  getByLicenceNumber: vi.fn(),
}))

const URL = '/licenceByNumber/LIC-0001'

async function buildApp(user?: { email: string; role: string }) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  // Stand-in for the real authenticate hook: sets request.user for the test.
  app.addHook('onRequest', async request => {
    request.user = user
  })
  const { getLicenceByNumber } = await import('./getByLicenceNumber.js')
  await app.register(getLicenceByNumber)
  await app.ready()
  return app
}

describe('GET /licenceByNumber/:licenceNumber role guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin gets 200', async () => {
    const { getByLicenceNumber } = await import(
      '../services/getByLicenceNumber.js'
    )
    vi.mocked(getByLicenceNumber).mockResolvedValue({
      success: true,
      message: 'Licence retrieved successfully',
      licenceDetails: [],
    })
    const app = await buildApp({ email: 'admin@mastertech.ie', role: 'admin' })

    const response = await app.inject({ method: 'GET', url: URL })

    expect(response.statusCode).toBe(200)
    expect(response.json().licenceDetails).toEqual([])
    expect(getByLicenceNumber).toHaveBeenCalledWith({
      licenceNumber: 'LIC-0001',
    })
    await app.close()
  })

  it.each(['staff', 'viewer', 'hr', 'hs_officer', 'dept_manager'])(
    '%s gets 403 AUTHORIZATION_ERROR and the service is not called',
    async role => {
      const { getByLicenceNumber } = await import(
        '../services/getByLicenceNumber.js'
      )
      const app = await buildApp({ email: 'user@mastertech.ie', role })

      const response = await app.inject({ method: 'GET', url: URL })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(getByLicenceNumber).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('no user gets 403 AUTHORIZATION_ERROR and the service is not called', async () => {
    const { getByLicenceNumber } = await import(
      '../services/getByLicenceNumber.js'
    )
    const app = await buildApp(undefined)

    const response = await app.inject({ method: 'GET', url: URL })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(getByLicenceNumber).not.toHaveBeenCalled()
    await app.close()
  })
})
