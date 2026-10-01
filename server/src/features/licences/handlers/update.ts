import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { LICENCE_STATUS } from '../../../constants/licenceEnums.js'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { update } from '../services/update.js'

export const updateLicence: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/licenceDetails/:id',
    {
      schema: {
        tags: ['Licences'],
        description: 'Update licence status, note and serial number',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        body: z.object({
          status: z.enum(LICENCE_STATUS, {
            message: ERROR_MESSAGES.INVALID_STATUS,
          }),
          note: z.string().min(10, ERROR_MESSAGES.INVALID_NOTE).nullable(),
          serialNumber: z.string().nullable().optional(),
          updatedBy: z.string().email(ERROR_MESSAGES.UPDATED_BY_REQUIRED),
        }),
        response: {
          200: z
            .object({ success: z.boolean(), message: z.string() })
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
            .describe('Bad Request'),
          401: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Unauthorized'),
          403: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Forbidden'),
          404: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Not Found'),
          500: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const licenceId = request.params.id
      const { status, note, serialNumber, updatedBy } = request.body
      if (!status.trim())
        throw new ValidationError(ERROR_MESSAGES.INVALID_STATUS)
      if (!updatedBy.trim())
        throw new ValidationError(ERROR_MESSAGES.UPDATED_BY_REQUIRED)
      const result = await update({
        id: licenceId,
        status,
        note,
        serialNumber,
        updatedBy,
      })
      return reply
        .status(200)
        .send({ success: result.success, message: result.message })
    }
  )
}
