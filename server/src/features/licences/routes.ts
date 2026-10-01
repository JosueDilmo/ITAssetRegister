import type { FastifyInstance } from 'fastify'
import { createLicence } from './handlers/create.js'
import { getAllLicences } from './handlers/getAll.js'
import { getLicenceById } from './handlers/getById.js'
import { getLicenceByNumber } from './handlers/getByLicenceNumber.js'
import { updateLicence } from './handlers/update.js'

export async function licenceRoutes(app: FastifyInstance) {
  app.register(getAllLicences)
  app.register(getLicenceById)
  app.register(getLicenceByNumber)
  app.register(createLicence)
  app.register(updateLicence)
}
