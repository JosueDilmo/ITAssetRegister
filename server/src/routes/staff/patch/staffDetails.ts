import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { ValidationError } from '../../../errors/errorTypes'
import { updateStaffDetails } from '../../../functions/staff/updateStaffDetails'

export const staffDetails: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/staffDetails/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(ERROR_MESSAGES.INVALID_ID),
        }),
        body: z.object({
          status: z.string().min(1, ERROR_MESSAGES.INVALID_STATUS),
          note: z.string().nullable(),
          updatedBy: z.string().min(1, ERROR_MESSAGES.MISSING_UPDATED_BY),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          400: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.any().optional(),
            }),
          }),
          404: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.any().optional(),
            }),
          }),
          500: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.any().optional(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const staffId = request.params.id
        const { status, note, updatedBy } = request.body

        if (!staffId.trim()) {
          throw new ValidationError(ERROR_MESSAGES.STAFF_ID_REQUIRED)
        }

        if (!updatedBy.trim()) {
          throw new ValidationError(ERROR_MESSAGES.MISSING_UPDATED_BY)
        }

        if (!status.trim()) {
          throw new ValidationError(ERROR_MESSAGES.STAFF_STATUS_REQUIRED)
        }

        const result = await updateStaffDetails({
          id: staffId,
          status: status,
          note: note,
          updatedBy: updatedBy,
        })

        return reply.status(200).send(result)
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
      }
    }
  )
}
