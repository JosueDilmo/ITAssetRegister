import type { FastifyInstance } from 'fastify'
import { assignAsset } from './handlers/assign.js'
import { assignLicenceHandler } from './handlers/assignLicence.js'
import { getAssetsByStaff } from './handlers/getByStaff.js'
import { getLicencesByStaffHandler } from './handlers/getLicencesByStaff.js'
import { unassignAsset } from './handlers/unassign.js'
import { unassignLicenceHandler } from './handlers/unassignLicence.js'

export async function assignmentRoutes(app: FastifyInstance) {
  app.register(assignAsset)
  app.register(unassignAsset)
  app.register(getAssetsByStaff)
  app.register(assignLicenceHandler)
  app.register(unassignLicenceHandler)
  app.register(getLicencesByStaffHandler)
}
