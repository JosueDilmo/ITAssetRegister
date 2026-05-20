import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ASSET_CONDITION } from '../../../constants/assetEnums.js'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { create } from '../services/create.js'

export const createAsset: FastifyPluginAsyncZod = async app => {
  app.post(
    '/newAsset',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Create a new IT asset',
        body: z.object({
          serialNumber: z.string().min(2, ERROR_MESSAGES.INVALID_SERIAL_NUMBER),
          name: z.string().min(2, ERROR_MESSAGES.INVALID_NAME),
          type: z.string().min(2, ERROR_MESSAGES.INVALID_ASSET_TYPE),
          maker: z.string().min(2, ERROR_MESSAGES.INVALID_MAKER),
          condition: z.enum(ASSET_CONDITION, { message: ERROR_MESSAGES.INVALID_CONDITION }),
          assignedTo: z.string().email().nullable(),
          datePurchased: z.string().date(ERROR_MESSAGES.INVALID_DATE),
          assetNumber: z.string().min(2, ERROR_MESSAGES.INVALID_ASSET_NUMBER),
          createdBy: z.string().email(),
        }),
        response: {
          200: z.object({ result: z.object({ success: z.boolean(), message: z.string(), staff: z.string().nullable(), assetId: z.string() }) }).describe('Successful'),
          400: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Bad Request'),
          401: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Unauthorized'),
          403: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Forbidden'),
          404: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Not Found'),
          409: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Conflict'),
          500: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const { serialNumber, name, type, maker, condition, assignedTo, datePurchased, assetNumber, createdBy } = request.body

      if (!serialNumber.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_SERIAL_REQUIRED)
      if (!name.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_NAME_REQUIRED)
      if (!type.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_TYPE_REQUIRED)
      if (!maker.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_MAKER_REQUIRED)
      if (!assetNumber.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_NUMBER_REQUIRED)
      if (!condition.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_CONDITION_REQUIRED)

      const result = await create({ serialNumber, name, type, maker, condition, assignedTo, datePurchased, assetNumber, createdBy })
      return reply.status(200).send({ result })
    }
  )
}
