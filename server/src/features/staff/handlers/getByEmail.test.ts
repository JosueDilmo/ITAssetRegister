import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/getByEmail.js', () => ({ getByEmail: vi.fn() }))

const staff = {
  id: '73a385f5-728d-42a8-ab2b-1646ad103dc0',
  name: 'X TEST USER',
  email: 'josue.santos@mastertech.ie',
}

async function buildApp() {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  const { getStaffByEmail } = await import('./getByEmail.js')
  await app.register(getStaffByEmail)
  await app.ready()
  return app
}

describe('GET /staffByEmail/:email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the id, name and email of the staff member', async () => {
    const { getByEmail } = await import('../services/getByEmail.js')
    vi.mocked(getByEmail).mockResolvedValue({ staff })
    const app = await buildApp()

    const response = await app.inject({
      method: 'GET',
      url: `/staffByEmail/${staff.email}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ staff })
    expect(getByEmail).toHaveBeenCalledWith({ email: staff.email })
    await app.close()
  })
})
