import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { assign } from '../services/assign.js'

export const assignAsset: FastifyPluginAsyncZod = async app => {
  app.post(
    '/assetToStaff/:email',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Assign an IT asset to a staff member by their email',
        params: z.object({ email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL) }),
        body: z.object({
          assetId: z.string().uuid(ERROR_MESSAGES.INVALID_ID),
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
      const staffEmail = request.params.email
      const { assetId, updatedBy, userConfirmed = false } = request.body
      if (!staffEmail.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_EMAIL_REQUIRED)
      if (!assetId.trim()) throw new ValidationError(ERROR_MESSAGES.ASSET_ID_REQUIRED)
      if (!updatedBy.trim()) throw new ValidationError(ERROR_MESSAGES.UPDATED_BY_REQUIRED)
      const result = await assign({ staffEmail, assetId, updatedBy, userConfirmed })
      return reply.status(200).send({ success: result.success, message: result.message })
    }
  )
}
