import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/getByEmail.js', () => ({ getByEmail: vi.fn() }))

const staff = {
  id: '73a385f5-728d-42a8-ab2b-1646ad103dc0',
  name: 'X TEST USER',
  email: 'jane@mastertech.ie',
}

async function buildApp(user?: { email: string; role: string }) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  // Stand-in for the real authenticate hook: sets request.user for the test.
  app.addHook('onRequest', async request => {
    request.user = user
  })
  const { getStaffByEmail } = await import('./getByEmail.js')
  await app.register(getStaffByEmail)
  await app.ready()
  return app
}

describe('GET /staffByEmail/:email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the id, name and email of the staff member to an admin', async () => {
    const { getByEmail } = await import('../services/getByEmail.js')
    vi.mocked(getByEmail).mockResolvedValue({ staff })
    const app = await buildApp({ email: 'admin@mastertech.ie', role: 'admin' })

    const response = await app.inject({
      method: 'GET',
      url: `/staffByEmail/${staff.email}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ staff })
    expect(getByEmail).toHaveBeenCalledWith({ email: staff.email })
    await app.close()
  })

  it.each(['staff', 'viewer', 'hr', 'hs_officer', 'dept_manager'])(
    '%s gets 403 AUTHORIZATION_ERROR and the service is not called',
    async role => {
      const { getByEmail } = await import('../services/getByEmail.js')
      const app = await buildApp({ email: 'user@mastertech.ie', role })

      const response = await app.inject({
        method: 'GET',
        url: `/staffByEmail/${staff.email}`,
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(getByEmail).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('no user gets 403 AUTHORIZATION_ERROR and the service is not called', async () => {
    const { getByEmail } = await import('../services/getByEmail.js')
    const app = await buildApp(undefined)

    const response = await app.inject({
      method: 'GET',
      url: `/staffByEmail/${staff.email}`,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(getByEmail).not.toHaveBeenCalled()
    await app.close()
  })
})
