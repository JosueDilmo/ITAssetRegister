import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { STAFF_STATUS } from '../../../constants/assetEnums.js'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { update } from '../services/update.js'

export const updateStaff: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/staffDetails/:id',
    {
      schema: {
        tags: ['Staff'],
        description: 'Update staff details such as status and note',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        body: z.object({
          status: z.enum(STAFF_STATUS, { message: ERROR_MESSAGES.INVALID_STATUS }),
          note: z.string().nullable(),
          updatedBy: z.string().min(1, ERROR_MESSAGES.UPDATED_BY_REQUIRED),
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
      const staffId = request.params.id
      const { status, note, updatedBy } = request.body
      if (!staffId.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_ID_REQUIRED)
      if (!updatedBy.trim()) throw new ValidationError(ERROR_MESSAGES.UPDATED_BY_REQUIRED)
      if (!status.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_STATUS_REQUIRED)
      const result = await update({ id: staffId, status, note, updatedBy })
      return reply.status(200).send(result)
    }
  )
}
