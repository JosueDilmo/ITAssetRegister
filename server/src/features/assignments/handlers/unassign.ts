import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { unassign } from '../services/unassign.js'

export const unassignAsset: FastifyPluginAsyncZod = async app => {
  app.delete(
    '/assetBy/:id',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Remove asset assignment by asset ID',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        body: z.object({
          updatedBy: z.string().email(ERROR_MESSAGES.UPDATED_BY_REQUIRED),
          userConfirmed: z.boolean().optional(),
        }),
        response: {
          200: z.object({ success: z.boolean(), message: z.string() }).describe('Successful'),
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
      const assetId = request.params.id
      const { updatedBy, userConfirmed = false } = request.body
      if (!assetId) throw new ValidationError(ERROR_MESSAGES.ASSET_ID_REQUIRED)
      const { success, message } = await unassign({ assetId, updatedBy, userConfirmed })
      return reply.status(200).send({ success, message })
    }
  )
}
