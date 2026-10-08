import type { FastifyReply, FastifyRequest } from 'fastify'
import { AuthorizationError, ERROR_MESSAGES } from '../errors/index.js'

// Access is always decided on the full roles array, never the badge role (D-02).
export function requireAnyRole(allowed: readonly string[]) {
  if (allowed.length === 0) {
    throw new Error('requireAnyRole: allowed roles must not be empty')
  }

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user

    if (!user) {
      throw new AuthorizationError(ERROR_MESSAGES.UNAUTHENTICATED)
    }

    if (!allowed.some(role => user.roles.includes(role))) {
      throw new AuthorizationError(ERROR_MESSAGES.INSUFFICIENT_ROLE)
    }
  }
}

export function requireRole(role: string) {
  return requireAnyRole([role])
}
