import type { FastifyInstance } from 'fastify'
import { assignAsset } from './handlers/assign.js'
import { getAssetsByStaff } from './handlers/getByStaff.js'
import { unassignAsset } from './handlers/unassign.js'

export async function assignmentRoutes(app: FastifyInstance) {
  app.register(assignAsset)
  app.register(unassignAsset)
  app.register(getAssetsByStaff)
}
