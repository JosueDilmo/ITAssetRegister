import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/getMe.js', () => ({ getMe: vi.fn() }))

const ASSET_ID = '22222222-2222-4222-8222-222222222222'
const LICENCE_ID = 'da06fb97-eefc-4e6a-a2ca-94bfaa85d841'

const serviceResult = {
  staff: {
    name: 'Jane Doe',
    email: 'jane@mastertech.ie',
    department: 'Engineering',
    jobTitle: 'Developer',
    status: 'ACTIVE',
  },
  assets: [
    {
      id: ASSET_ID,
      assetNumber: 'IT-0001',
      type: 'Laptop',
      maker: 'Dell',
      name: 'Latitude 7440',
      serialNumber: 'SN-0001',
    },
  ],
  licences: [
    {
      id: LICENCE_ID,
      licenceNumber: 'LIC-0001',
      name: 'ADOBE ACROBAT PRO',
      licenceType: 'SUBSCRIPTION',
      expiryDate: '2027-01-01',
    },
  ],
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
  const { getMeHandler } = await import('./getMe.js')
  await app.register(getMeHandler)
  await app.ready()
  return app
}

describe('GET /me', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { getMe } = await import('../services/getMe.js')
    vi.mocked(getMe).mockResolvedValue(structuredClone(serviceResult))
  })

  it('returns the signed-in user profile, assets and licences', async () => {
    const { getMe } = await import('../services/getMe.js')
    const app = await buildApp({ email: 'jane@mastertech.ie', role: 'staff' })

    const response = await app.inject({ method: 'GET', url: '/me' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual(serviceResult)
    expect(getMe).toHaveBeenCalledTimes(1)
    expect(getMe).toHaveBeenCalledWith({ email: 'jane@mastertech.ie' })
    await app.close()
  })
})
