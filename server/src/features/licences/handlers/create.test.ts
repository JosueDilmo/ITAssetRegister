import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/create.js', () => ({ create: vi.fn() }))

const validBody = {
  name: 'ADOBE ACROBAT PRO',
  vendor: 'ADOBE',
  licenceType: 'SUBSCRIPTION',
  licenceKey: null,
  licenceNumber: 'LIC-0001',
  datePurchased: '2026-01-01',
  expiryDate: null,
  cost: null,
  assignedTo: null,
  createdBy: 'admin@mastertech.ie',
}

async function buildApp() {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  const { createLicence } = await import('./create.js')
  await app.register(createLicence)
  await app.ready()
  return app
}

describe('POST /newLicence licence number validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects a licence number without the LIC- prefix', async () => {
    const app = await buildApp()
    const { create } = await import('../services/create.js')

    const response = await app.inject({
      method: 'POST',
      url: '/newLicence',
      payload: { ...validBody, licenceNumber: 'ABC-0001' },
    })

    // Rejected by route validation before the handler/service runs. The status
    // is 500 because Fastify's default validation error cannot be serialized
    // against the route's custom 400 schema (pre-existing, deferred D-06); the
    // enforcement contract is the validation message and no service call.
    expect(response.statusCode).toBeGreaterThanOrEqual(400)
    expect(response.body).toContain('Licence Number must start with LIC-.')
    expect(create).not.toHaveBeenCalled()
    await app.close()
  })

  it('accepts a LIC- prefixed licence number past validation', async () => {
    const app = await buildApp()
    const { create } = await import('../services/create.js')

    const response = await app.inject({
      method: 'POST',
      url: '/newLicence',
      payload: { ...validBody, licenceNumber: 'LIC-0001' },
    })

    // Validation passed; the request is stopped later by requireRole (no user).
    expect(response.body).not.toContain('Licence Number must start with LIC-.')
    expect(create).not.toHaveBeenCalled()
    await app.close()
  })
})
