import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

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
  const { getLicenceById } = await import('./getById.js')
  await app.register(getLicenceById)
  await app.ready()
  return app
}

describe('GET /licenceWithId/:id admin-only access', () => {
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

  it('returns the real licenceKey to a multi-role admin', async () => {
    const app = await buildApp({
      email: 'a@mastertech.ie',
      role: 'admin',
      roles: ['hs_officer', 'admin'],
    })
    const response = await app.inject({
      method: 'GET',
      url: `/licenceWithId/${LICENCE_ID}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().licence[0].licenceKey).toBe('AAAA-BBBB-CCCC-DDDD')
    await app.close()
  })

  it('decides from roles, not the badge: role hr with roles [hr, admin] sees the key', async () => {
    const app = await buildApp({
      email: 'a@mastertech.ie',
      role: 'hr',
      roles: ['hr', 'admin'],
    })
    const response = await app.inject({
      method: 'GET',
      url: `/licenceWithId/${LICENCE_ID}`,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().licence[0].licenceKey).toBe('AAAA-BBBB-CCCC-DDDD')
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
    '%s gets 403 AUTHORIZATION_ERROR, no licence key, and the service is not called',
    async role => {
      const { getById } = await import('../services/getById.js')
      const app = await buildApp({ email: 'x@mastertech.ie', role })
      const response = await app.inject({
        method: 'GET',
        url: `/licenceWithId/${LICENCE_ID}`,
      })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(response.body).not.toContain('AAAA-BBBB-CCCC-DDDD')
      expect(getById).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('no user gets 403 AUTHORIZATION_ERROR, no licence key, and the service is not called', async () => {
    const { getById } = await import('../services/getById.js')
    const app = await buildApp(undefined)
    const response = await app.inject({
      method: 'GET',
      url: `/licenceWithId/${LICENCE_ID}`,
    })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(response.body).not.toContain('AAAA-BBBB-CCCC-DDDD')
    expect(getById).not.toHaveBeenCalled()
    await app.close()
  })
})
