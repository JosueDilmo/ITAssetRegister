import type { FastifyInstance } from 'fastify'
import { createAsset } from './handlers/create.js'
import { getAllAssets } from './handlers/getAll.js'
import { getAssetById } from './handlers/getById.js'
import { getAssetBySerial } from './handlers/getBySerial.js'
import { updateAsset } from './handlers/update.js'

export async function assetRoutes(app: FastifyInstance) {
  app.register(getAllAssets)
  app.register(getAssetById)
  app.register(getAssetBySerial)
  app.register(createAsset)
  app.register(updateAsset)
}
