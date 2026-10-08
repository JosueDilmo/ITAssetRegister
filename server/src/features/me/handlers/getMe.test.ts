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

// A service result carrying fields the contract must never expose.
const overPosted = {
  staff: {
    ...serviceResult.staff,
    id: '11111111-1111-4111-8111-111111111111',
    note: 'private staff note',
    changeLog: [{ field: 'jobTitle' }],
    createdBy: 'admin@mastertech.ie',
    assetHistoryList: [{ assetId: ASSET_ID }],
    licenceHistoryList: [{ licenceId: LICENCE_ID }],
  },
  assets: serviceResult.assets,
  licences: [
    {
      ...serviceResult.licences[0],
      licenceKey: 'AAAA-BBBB-CCCC-DDDD',
      note: 'private licence note',
      changeLog: [{ field: 'status' }],
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

  it.each([
    'admin',
    'staff',
    'viewer',
    'hr',
    'hs_officer',
    'dept_manager',
    'site_supervisor',
  ])('answers 200 for a %s user (no role gate)', async role => {
    const app = await buildApp({ email: 'jane@mastertech.ie', role })

    const response = await app.inject({ method: 'GET', url: '/me' })

    expect(response.statusCode).toBe(200)
    await app.close()
  })

  it('answers 200 with staff null and empty lists when the user has no staff record', async () => {
    const { getMe } = await import('../services/getMe.js')
    vi.mocked(getMe).mockResolvedValue({
      staff: null,
      assets: [],
      licences: [],
    })
    const app = await buildApp({ email: 'new@mastertech.ie', role: 'staff' })

    const response = await app.inject({ method: 'GET', url: '/me' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ staff: null, assets: [], licences: [] })
    await app.close()
  })

  it('strips every field outside the allowlist from the response', async () => {
    const { getMe } = await import('../services/getMe.js')
    vi.mocked(getMe).mockResolvedValue(overPosted as never)
    const app = await buildApp({ email: 'jane@mastertech.ie', role: 'staff' })

    const response = await app.inject({ method: 'GET', url: '/me' })
    const json = response.json()

    expect(response.statusCode).toBe(200)
    expect(Object.keys(json.staff).sort()).toEqual([
      'department',
      'email',
      'jobTitle',
      'name',
      'status',
    ])
    expect(Object.keys(json.licences[0]).sort()).toEqual([
      'expiryDate',
      'id',
      'licenceNumber',
      'licenceType',
      'name',
    ])
    expect(response.body).not.toContain('AAAA-BBBB-CCCC-DDDD')
    await app.close()
  })

  it('ignores a client-supplied email and calls the service with the session email only', async () => {
    const { getMe } = await import('../services/getMe.js')
    const app = await buildApp({ email: 'jane@mastertech.ie', role: 'staff' })

    const response = await app.inject({
      method: 'GET',
      url: '/me?email=other@mastertech.ie',
    })

    expect(response.statusCode).toBe(200)
    expect(getMe).toHaveBeenCalledTimes(1)
    expect(getMe).toHaveBeenCalledWith({ email: 'jane@mastertech.ie' })
    await app.close()
  })

  it('answers 401 AUTHENTICATION_ERROR without a session and does not call the service', async () => {
    const { getMe } = await import('../services/getMe.js')
    const app = await buildApp(undefined)

    const response = await app.inject({ method: 'GET', url: '/me' })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('AUTHENTICATION_ERROR')
    expect(getMe).not.toHaveBeenCalled()
    await app.close()
  })
})
