import fastifyCookie from '@fastify/cookie'
import { fastify } from 'fastify'
import {
  type ZodTypeProvider,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { EncryptJWT } from 'jose'
import { describe, expect, it, vi } from 'vitest'
import { errorHandler } from '../errors/index.js'

vi.mock('../env.js', () => ({ env: { AUTH_SECRET: 'test-auth-secret' } }))

const COOKIE_NAME = 'authjs.session-token'

// Independent re-implementation of the Auth.js key derivation so that drift in
// the production derivation makes these tests fail.
async function deriveAuthJsKey(secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    'HKDF',
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(COOKIE_NAME),
      info: encoder.encode(`Auth.js Generated Encryption Key (${COOKIE_NAME})`),
    },
    keyMaterial,
    512
  )
  return new Uint8Array(bits)
}

async function buildCookie(
  payload: Record<string, unknown>,
  options: { expired?: boolean } = {}
) {
  const key = await deriveAuthJsKey('test-auth-secret')
  const now = Math.floor(Date.now() / 1000)
  const jwt = new EncryptJWT(payload)
    .setProtectedHeader({ alg: 'dir', enc: 'A256CBC-HS512' })
    .setIssuedAt()
  if (options.expired) {
    jwt.setExpirationTime(now - 60)
  } else {
    jwt.setExpirationTime('1h')
  }
  return jwt.encrypt(key)
}

async function buildApp() {
  const { authenticate } = await import('./authenticate.js')
  const { requireAnyRole, requireRole } = await import('./requireRole.js')

  const app = fastify().withTypeProvider<ZodTypeProvider>()
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  await app.register(fastifyCookie)
  app.addHook('onRequest', authenticate)

  app.get('/api/whoami', async request => request.user ?? null)
  app.get(
    '/api/hs-probe',
    {
      preHandler: [requireAnyRole(['site_supervisor', 'hs_officer', 'admin'])],
    },
    async () => ({ ok: true })
  )
  app.get(
    '/api/admin-probe',
    { preHandler: [requireRole('admin')] },
    async () => ({ ok: true })
  )
  await app.ready()
  return app
}

async function call(
  url: string,
  payload: Record<string, unknown>,
  options?: { expired?: boolean }
) {
  const app = await buildApp()
  const jwe = await buildCookie(payload, options)
  const response = await app.inject({
    method: 'GET',
    url,
    cookies: { [COOKIE_NAME]: jwe },
  })
  await app.close()
  return response
}

const EMAIL = 'user@mastertech.ie'

describe('authenticate: roles decoded from the Auth.js session cookie', () => {
  it('site_supervisor: roles [site_supervisor], any-of 200, admin 403', async () => {
    const payload = {
      email: EMAIL,
      role: 'site_supervisor',
      roles: ['site_supervisor'],
    }

    const who = await call('/api/whoami', payload)
    const any = await call('/api/hs-probe', payload)
    const admin = await call('/api/admin-probe', payload)

    expect(who.statusCode).toBe(200)
    expect(who.json()).toEqual({
      email: EMAIL,
      role: 'site_supervisor',
      roles: ['site_supervisor'],
    })
    expect(any.statusCode).toBe(200)
    expect(admin.statusCode).toBe(403)
    expect(admin.json().error.code).toBe('AUTHORIZATION_ERROR')
  })

  it('hs_officer + admin: both routes 200', async () => {
    const payload = {
      email: EMAIL,
      role: 'admin',
      roles: ['hs_officer', 'admin'],
    }

    const any = await call('/api/hs-probe', payload)
    const admin = await call('/api/admin-probe', payload)

    expect(any.statusCode).toBe(200)
    expect(admin.statusCode).toBe(200)
  })

  it('hr + site_supervisor with badge role hr: any-of 200, admin 403 (D-02)', async () => {
    const payload = {
      email: EMAIL,
      role: 'hr',
      roles: ['hr', 'site_supervisor'],
    }

    const any = await call('/api/hs-probe', payload)
    const admin = await call('/api/admin-probe', payload)

    expect(any.statusCode).toBe(200)
    expect(admin.statusCode).toBe(403)
    expect(admin.json().error.code).toBe('AUTHORIZATION_ERROR')
  })

  it('missing roles claim: roles falls back to [role]', async () => {
    const payload = { email: EMAIL, role: 'admin' }

    const who = await call('/api/whoami', payload)
    const admin = await call('/api/admin-probe', payload)

    expect(who.json().roles).toEqual(['admin'])
    expect(admin.statusCode).toBe(200)
  })

  it('empty roles array with role staff: roles [staff]', async () => {
    const who = await call('/api/whoami', {
      email: EMAIL,
      role: 'staff',
      roles: [],
    })

    expect(who.json().roles).toEqual(['staff'])
  })

  it('roles that is a string (not an array) with role staff: roles [staff]', async () => {
    const who = await call('/api/whoami', {
      email: EMAIL,
      role: 'staff',
      roles: 'admin',
    })

    expect(who.json().roles).toEqual(['staff'])
  })

  it('drops non-string and empty entries and de-duplicates', async () => {
    const who = await call('/api/whoami', {
      email: EMAIL,
      role: 'admin',
      roles: ['admin', 42, '', 'admin'],
    })

    expect(who.json().roles).toEqual(['admin'])
  })

  it('keeps first-seen order', async () => {
    const who = await call('/api/whoami', {
      email: EMAIL,
      role: 'admin',
      roles: ['hs_officer', 'admin', 'hs_officer'],
    })

    expect(who.json().roles).toEqual(['hs_officer', 'admin'])
  })

  it('no role and no roles: role viewer, roles [viewer]', async () => {
    const who = await call('/api/whoami', { email: EMAIL })

    expect(who.json().role).toBe('viewer')
    expect(who.json().roles).toEqual(['viewer'])
  })
})

describe('authenticate: rejected sessions return 401 AUTHENTICATION_ERROR', () => {
  it('expired cookie', async () => {
    const response = await call(
      '/api/whoami',
      { email: EMAIL, role: 'admin', roles: ['admin'] },
      { expired: true }
    )

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('AUTHENTICATION_ERROR')
  })

  it('cookie without email', async () => {
    const response = await call('/api/whoami', {
      role: 'admin',
      roles: ['admin'],
    })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('AUTHENTICATION_ERROR')
  })

  it('no cookie', async () => {
    const app = await buildApp()

    const response = await app.inject({ method: 'GET', url: '/api/whoami' })

    expect(response.statusCode).toBe(401)
    expect(response.json().error.code).toBe('AUTHENTICATION_ERROR')
    await app.close()
  })
})
