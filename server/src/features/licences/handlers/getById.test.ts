import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/getById.js', () => ({ getById: vi.fn() }))

const LICENCE_ID = 'da06fb97-eefc-4e6a-a2ca-94bfaa85d841'

const serviceResult = {
  licence: [
    {
      id: LICENCE_ID,
      name: 'ADOBE ACROBAT PRO',
      vendor: 'ADOBE',
      licenceType: 'SUBSCRIPTION',
      licenceKey: 'AAAA-BBBB-CCCC-DDDD',
      serialNumber: null,
      licenceNumber: 'LIC-0001',
      datePurchased: '2026-01-01',
      expiryDate: null,
      seatsTotal: 1,
      cost: null,
      assignedTo: null,
      dateAssigned: null,
      status: 'ACTIVE',
      note: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      createdBy: 'admin@mastertech.ie',
      changeLog: [],
    },
  ],
}

async function buildApp(user?: { email: string; role: string }) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  // Stand-in for the real authenticate hook: sets request.user for the test.
  app.addHook('onRequest', async request => {
    request.user = user
  })
  const { getLicenceById } = await import('./getById.js')
  await app.register(getLicenceById)
  await app.ready()
  return app
}

describe('GET /licenceWithId/:id licence key exposure', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    const { getById } = await import('../services/getById.js')
    vi.mocked(getById).mockResolvedValue(structuredClone(serviceResult))
  })

  it('returns the real licenceKey to an admin', async () => {
    const app = await buildApp({ email: 'a@mastertech.ie', role: 'admin' })
    const response = await app.inject({
      method: 'GET',
      url: `/licenceWithId/${LICENCE_ID}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().licence[0].licenceKey).toBe('AAAA-BBBB-CCCC-DDDD')
    await app.close()
  })

  it.each(['staff', 'viewer', 'hr'])(
    'returns a null licenceKey to a %s user',
    async role => {
      const app = await buildApp({ email: 'x@mastertech.ie', role })
      const response = await app.inject({
        method: 'GET',
        url: `/licenceWithId/${LICENCE_ID}`,
      })

      expect(response.statusCode).toBe(200)
      expect(response.json().licence[0].licenceKey).toBeNull()
      expect(response.body).not.toContain('AAAA-BBBB-CCCC-DDDD')
      // The rest of the licence is still returned (read-only view works).
      expect(response.json().licence[0].licenceNumber).toBe('LIC-0001')
      await app.close()
    }
  )

  it('returns a null licenceKey when there is no authenticated user', async () => {
    const app = await buildApp(undefined)
    const response = await app.inject({
      method: 'GET',
      url: `/licenceWithId/${LICENCE_ID}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).not.toContain('AAAA-BBBB-CCCC-DDDD')
    await app.close()
  })
})
