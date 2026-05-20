import type { FastifyInstance } from 'fastify'
import { createStaff } from './handlers/create.js'
import { getAllStaff } from './handlers/getAll.js'
import { getStaffById } from './handlers/getById.js'
import { updateStaff } from './handlers/update.js'

export async function staffRoutes(app: FastifyInstance) {
  app.register(getAllStaff)
  app.register(getStaffById)
  app.register(createStaff)
  app.register(updateStaff)
}
