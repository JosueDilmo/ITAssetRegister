import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../../../errors/index.js'

vi.mock('../services/create.js', () => ({ create: vi.fn() }))
vi.mock('../services/update.js', () => ({ update: vi.fn() }))
vi.mock('../../assignments/services/assignLicence.js', () => ({
  assignLicence: vi.fn(),
}))
vi.mock('../../assignments/services/unassignLicence.js', () => ({
  unassignLicence: vi.fn(),
}))

const ID = 'da06fb97-eefc-4e6a-a2ca-94bfaa85d841'
const ok = { success: true, message: 'ok' }

type Case = {
  name: string
  method: 'POST' | 'PATCH' | 'DELETE'
  url: string
  payload: Record<string, unknown>
  load: () => Promise<{ plugin: never; service: ReturnType<typeof vi.fn> }>
}

const cases: Case[] = [
  {
    name: 'POST /newLicence',
    method: 'POST',
    url: '/newLicence',
    payload: {
      name: 'Adobe Acrobat',
      vendor: 'Adobe',
      licenceType: 'SUBSCRIPTION',
      licenceKey: null,
      serialNumber: null,
      licenceNumber: 'LIC-0001',
      datePurchased: '2026-01-01',
      expiryDate: null,
      cost: null,
      assignedTo: null,
      createdBy: 'admin@mastertech.ie',
    },
    load: async () => ({
      plugin: (await import('./create.js')).createLicence as never,
      service: (await import('../services/create.js')).create as never,
    }),
  },
  {
    name: 'PATCH /licenceDetails/:id',
    method: 'PATCH',
    url: `/licenceDetails/${ID}`,
    payload: {
      status: 'ACTIVE',
      note: 'a long enough note',
      updatedBy: 'admin@mastertech.ie',
    },
    load: async () => ({
      plugin: (await import('./update.js')).updateLicence as never,
      service: (await import('../services/update.js')).update as never,
    }),
  },
  {
    name: 'POST /licenceToStaff/:email',
    method: 'POST',
    url: '/licenceToStaff/staff@mastertech.ie',
    payload: { licenceId: ID, updatedBy: 'admin@mastertech.ie' },
    load: async () => ({
      plugin: (await import('../../assignments/handlers/assignLicence.js'))
        .assignLicenceHandler as never,
      service: (await import('../../assignments/services/assignLicence.js'))
        .assignLicence as never,
    }),
  },
  {
    name: 'DELETE /licenceBy/:id',
    method: 'DELETE',
    url: `/licenceBy/${ID}`,
    payload: { updatedBy: 'admin@mastertech.ie' },
    load: async () => ({
      plugin: (await import('../../assignments/handlers/unassignLicence.js'))
        .unassignLicenceHandler as never,
      service: (await import('../../assignments/services/unassignLicence.js'))
        .unassignLicence as never,
    }),
  },
]

async function buildApp(
  plugin: never,
  user?: { email: string; role: string }
) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  app.addHook('onRequest', async request => {
    request.user = user
  })
  await app.register(plugin)
  await app.ready()
  return app
}

describe.each(cases)('$name admin-only mutation', c => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function setup(user?: { email: string; role: string }) {
    const { plugin, service } = await c.load()
    service.mockResolvedValue({
      ...ok,
      staff: null,
      licenceId: ID,
    })
    const app = await buildApp(plugin, user)
    return { app, service }
  }

  it('admin reaches the service', async () => {
    const { app, service } = await setup({
      email: 'a@mastertech.ie',
      role: 'admin',
    })
    const res = await app.inject({
      method: c.method,
      url: c.url,
      payload: c.payload,
    })
    expect(res.statusCode).toBe(200)
    expect(service).toHaveBeenCalledTimes(1)
    await app.close()
  })

  it.each(['viewer', 'staff', 'hr', 'hs_officer', 'dept_manager'])(
    '%s gets 403 AUTHORIZATION_ERROR and the service is not called',
    async role => {
      const { app, service } = await setup({
        email: 'x@mastertech.ie',
        role,
      })
      const res = await app.inject({
        method: c.method,
        url: c.url,
        payload: c.payload,
      })
      expect(res.statusCode).toBe(403)
      expect(res.json().error.code).toBe('AUTHORIZATION_ERROR')
      expect(service).not.toHaveBeenCalled()
      await app.close()
    }
  )

  it('no user is rejected with AUTHORIZATION_ERROR and the service is not called', async () => {
    const { app, service } = await setup(undefined)
    const res = await app.inject({
      method: c.method,
      url: c.url,
      payload: c.payload,
    })
    expect(res.statusCode).toBe(403)
    expect(res.json().error.code).toBe('AUTHORIZATION_ERROR')
    expect(service).not.toHaveBeenCalled()
    await app.close()
  })
})
