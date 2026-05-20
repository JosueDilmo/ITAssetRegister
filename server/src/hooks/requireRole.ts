import type { FastifyReply, FastifyRequest } from 'fastify'
import { AuthorizationError, ERROR_MESSAGES } from '../errors/index.js'

export function requireRole(role: string) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw new AuthorizationError(ERROR_MESSAGES.UNAUTHENTICATED)
    }

    if (request.user.role !== role) {
      throw new AuthorizationError(ERROR_MESSAGES.INSUFFICIENT_ROLE)
    }
  }
}
