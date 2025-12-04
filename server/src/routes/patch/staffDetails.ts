import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../errors'
import { updateStaffDetails } from '../../functions/updateStaffDetails'

export const staffDetails: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/staffDetails/:id',
    {
      schema: {
        tags: ['Staff'],
        description: 'Update staff details such as status and note',
        params: z.object({
          id: z.string().uuid(ERROR_MESSAGES.INVALID_ID),
        }),
        body: z.object({
          status: z.string().min(1, ERROR_MESSAGES.INVALID_STATUS),
          note: z.string().nullable(),
          updatedBy: z.string().min(1, ERROR_MESSAGES.UPDATED_BY_REQUIRED),
        }),
        response: {
          200: z
            .object({
              success: z.boolean(),
              message: z.string(),
            })
            .describe('Successful'),
          400: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Bad Request - Input Validation'),
          401: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Unauthorized - Authentication'),
          403: z.object({
            success: z.boolean(),
            error: z
              .object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              })
              .describe('Forbidden - Authorization'),
          }),
          404: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.string().optional(),
              }),
            })
            .describe('Not Found - Resource Not Found'),
          409: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Conflict - Resource Conflicts'),
          500: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Internal Server Error - Unexpected Errors'),
        },
      },
    },
    async (request, reply) => {
      const staffId = request.params.id
      const { status, note, updatedBy } = request.body

      if (!staffId.trim()) {
        throw new ValidationError(ERROR_MESSAGES.STAFF_ID_REQUIRED)
      }

      if (!updatedBy.trim()) {
        throw new ValidationError(ERROR_MESSAGES.UPDATED_BY_REQUIRED)
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
    }
  )
}
