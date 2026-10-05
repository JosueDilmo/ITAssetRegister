import type { FastifyInstance } from 'fastify'
import { getMeHandler } from './handlers/getMe.js'

export async function meRoutes(app: FastifyInstance) {
  app.register(getMeHandler)
}
