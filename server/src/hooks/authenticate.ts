import { jwtDecrypt } from 'jose'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../env.js'
import { AuthenticationError, ERROR_MESSAGES } from '../errors/index.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      email: string
      role: string
    }
  }
}

const COOKIE_NAME = 'authjs.session-token'

async function deriveEncryptionKey(secret: string, salt: string): Promise<Uint8Array> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HKDF' },
    false,
    ['deriveBits']
  )
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(salt),
      info: encoder.encode(`Auth.js Generated Encryption Key (${salt})`),
    },
    keyMaterial,
    512
  )
  return new Uint8Array(derived)
}

let cachedKey: Uint8Array | null = null

async function getEncryptionKey(): Promise<Uint8Array> {
  if (!cachedKey) {
    cachedKey = await deriveEncryptionKey(env.AUTH_SECRET, COOKIE_NAME)
  }
  return cachedKey
}

export async function authenticate(
  request: FastifyRequest,
  _reply: FastifyReply
) {
  if (request.url.startsWith('/api/docs')) return

  const token =
    request.cookies?.[COOKIE_NAME] ??
    request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    throw new AuthenticationError(ERROR_MESSAGES.MISSING_TOKEN)
  }

  try {
    const key = await getEncryptionKey()
    const { payload } = await jwtDecrypt(token, key)

    const email = payload.email as string | undefined
    const role = (payload.role as string) ?? 'viewer'

    if (!email) {
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_TOKEN)
    }

    request.user = { email, role }
  } catch (error) {
    if (error instanceof AuthenticationError) throw error
    throw new AuthenticationError(ERROR_MESSAGES.INVALID_TOKEN)
  }
}
