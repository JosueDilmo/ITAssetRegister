import type { FastifyInstance } from 'fastify'
import { getProjectsHandler } from './handlers/getProjects.js'

export async function hsRoutes(app: FastifyInstance) {
  app.register(getProjectsHandler)
}
