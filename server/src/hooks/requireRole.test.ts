import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { describe, expect, it } from 'vitest'
import { ERROR_MESSAGES, errorHandler } from '../errors/index.js'
import { requireAnyRole, requireRole } from './requireRole.js'

type TestUser = { email: string; role: string; roles: string[] }

async function buildApp(user?: TestUser) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  // Stand-in for the real authenticate hook: sets request.user for the test.
  app.addHook('onRequest', async request => {
    request.user = user
  })
  app.get(
    '/any',
    {
      preHandler: [requireAnyRole(['site_supervisor', 'hs_officer', 'admin'])],
    },
    async () => ({ ok: true })
  )
  app.get('/admin', { preHandler: [requireRole('admin')] }, async () => ({
    ok: true,
  }))
  await app.ready()
  return app
}

function userWith(role: string, roles: string[] = [role]): TestUser {
  return { email: 'user@mastertech.ie', role, roles }
}

describe('requireAnyRole', () => {
  it.each(['site_supervisor', 'hs_officer', 'admin'])(
    '%s gets 200 on the any-of route',
    async role => {
      const app = await buildApp(userWith(role))

      const response = await app.inject({ method: 'GET', url: '/any' })

      expect(response.statusCode).toBe(200)
      await app.close()
    }
  )

  it.each(['staff', 'viewer', 'hr', 'dept_manager'])(
    '%s gets 403 AUTHORIZATION_ERROR on the any-of route',
    async role => {
      const app = await buildApp(userWith(role))

      const response = await app.inject({ method: 'GET', url: '/any' })

      expect(response.statusCode).toBe(403)
      expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
      await app.close()
    }
  )

  it('lets a multi-role user through when any one role is listed (hr + site_supervisor)', async () => {
    const app = await buildApp(userWith('hr', ['hr', 'site_supervisor']))

    const response = await app.inject({ method: 'GET', url: '/any' })

    expect(response.statusCode).toBe(200)
    await app.close()
  })

  it('decides on roles[], never the badge role (D-02)', async () => {
    const app = await buildApp(userWith('site_supervisor', ['staff']))

    const response = await app.inject({ method: 'GET', url: '/any' })

    expect(response.statusCode).toBe(403)
    await app.close()
  })

  it('returns 403 with the UNAUTHENTICATED message when there is no user', async () => {
    const app = await buildApp(undefined)

    const response = await app.inject({ method: 'GET', url: '/any' })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.message).toBe(ERROR_MESSAGES.UNAUTHENTICATED)
    await app.close()
  })

  it('throws when the allow-list is empty (fails at route registration)', () => {
    expect(() => requireAnyRole([])).toThrow()
  })
})

describe('requireRole("admin") delegating to requireAnyRole', () => {
  it('admin gets 200', async () => {
    const app = await buildApp(userWith('admin'))

    const response = await app.inject({ method: 'GET', url: '/admin' })

    expect(response.statusCode).toBe(200)
    await app.close()
  })

  it.each([
    'site_supervisor',
    'hs_officer',
    'hr',
    'dept_manager',
    'staff',
    'viewer',
  ])('%s gets 403 AUTHORIZATION_ERROR', async role => {
    const app = await buildApp(userWith(role))

    const response = await app.inject({ method: 'GET', url: '/admin' })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    await app.close()
  })

  it('a hr + site_supervisor user gets 403 on the admin route (D-02)', async () => {
    const app = await buildApp(userWith('hr', ['hr', 'site_supervisor']))

    const response = await app.inject({ method: 'GET', url: '/admin' })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.code).toBe('AUTHORIZATION_ERROR')
    await app.close()
  })

  it('a hs_officer + admin user passes both routes', async () => {
    const app = await buildApp(userWith('admin', ['hs_officer', 'admin']))

    const any = await app.inject({ method: 'GET', url: '/any' })
    const admin = await app.inject({ method: 'GET', url: '/admin' })

    expect(any.statusCode).toBe(200)
    expect(admin.statusCode).toBe(200)
    await app.close()
  })

  it('returns 403 with the UNAUTHENTICATED message when there is no user', async () => {
    const app = await buildApp(undefined)

    const response = await app.inject({ method: 'GET', url: '/admin' })

    expect(response.statusCode).toBe(403)
    expect(response.json().error.message).toBe(ERROR_MESSAGES.UNAUTHENTICATED)
    await app.close()
  })
})

describe('role order and duplication do not change the outcome', () => {
  it.each([
    ['admin', 'hs_officer'],
    ['hs_officer', 'admin'],
    ['admin', 'admin'],
  ])('roles [%s, %s] pass both routes', async (first, second) => {
    const app = await buildApp(userWith('admin', [first, second]))

    const any = await app.inject({ method: 'GET', url: '/any' })
    const admin = await app.inject({ method: 'GET', url: '/admin' })

    expect(any.statusCode).toBe(200)
    expect(admin.statusCode).toBe(200)
    await app.close()
  })
})
