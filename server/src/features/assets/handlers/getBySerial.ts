import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { getBySerial } from '../services/getBySerial.js'

export const getAssetBySerial: FastifyPluginAsyncZod = async app => {
  app.get(
    '/assetBySerial/:serialNumber',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Get an IT asset by its serial number',
        params: z.object({ serialNumber: z.string().min(2, ERROR_MESSAGES.INVALID_SERIAL_NUMBER) }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
            assetDetails: z.array(z.object({
              id: z.string(),
              serialNumber: z.string(),
              name: z.string(),
              type: z.string(),
              maker: z.string(),
              condition: z.string(),
              assignedTo: z.string().nullable(),
              datePurchased: z.string(),
              assetNumber: z.string(),
              status: z.string(),
              note: z.string().nullable(),
              createdAt: z.string(),
              createdBy: z.string(),
            })),
          }).describe('Successful'),
          400: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Bad Request'),
          401: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Unauthorized'),
          403: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Forbidden'),
          404: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Not Found'),
          409: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Conflict'),
          500: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Internal Server Error'),
        },
      },
    },
    async (request, reply) => {
      const { serialNumber } = request.params
      if (!serialNumber.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_SERIAL_REQUIRED)
      const { success, message, assetDetails } = await getBySerial({ serialNumber })
      return reply.status(200).send({
        success,
        message,
        assetDetails: assetDetails.map(asset => ({
          ...asset,
          createdAt: asset.createdAt.toISOString(),
        })),
      })
    }
  )
}
