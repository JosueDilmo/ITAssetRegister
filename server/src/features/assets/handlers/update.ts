import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ASSET_CONDITION, ASSET_STATUS } from '../../../constants/assetEnums.js'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { update } from '../services/update.js'

export const updateAsset: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/assetDetails/:id',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Update IT asset details such as status, condition and note',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        body: z.object({
          status: z.enum(ASSET_STATUS, { message: ERROR_MESSAGES.INVALID_STATUS }),
          condition: z.enum(ASSET_CONDITION, { message: ERROR_MESSAGES.INVALID_CONDITION }),
          note: z.string().min(10, ERROR_MESSAGES.INVALID_NOTE).nullable(),
          updatedBy: z.string().email(ERROR_MESSAGES.UPDATED_BY_REQUIRED),
        }),
        response: {
          200: z.object({ success: z.boolean(), message: z.string() }).describe('Successful'),
          400: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Bad Request'),
          401: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Unauthorized'),
          403: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Forbidden'),
          404: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Not Found'),
          500: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const assetID = request.params.id
      const { status, condition, note, updatedBy } = request.body
      if (!status.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_STATUS_REQUIRED)
      if (!condition.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_CONDITION_REQUIRED)
      if (!updatedBy.trim()) throw new ValidationError(ERROR_MESSAGES.UPDATED_BY_REQUIRED)
      const result = await update({ id: assetID, status, condition, note, updatedBy })
      return reply.status(200).send({ success: result.success, message: result.message })
    }
  )
}
