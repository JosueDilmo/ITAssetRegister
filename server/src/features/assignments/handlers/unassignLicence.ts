import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { unassignLicence } from '../services/unassignLicence.js'

export const unassignLicenceHandler: FastifyPluginAsyncZod = async app => {
  app.delete(
    '/licenceBy/:id',
    {
      schema: {
        tags: ['Licences'],
        description: 'Remove licence assignment by licence ID',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        body: z.object({
          updatedBy: z.string().email(ERROR_MESSAGES.UPDATED_BY_REQUIRED),
          userConfirmed: z.boolean().optional(),
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
          409: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Conflict'),
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
      const { updatedBy, userConfirmed = false } = request.body
      if (!licenceId)
        throw new ValidationError(ERROR_MESSAGES.LICENCE_ID_REQUIRED)
      const { success, message } = await unassignLicence({
        licenceId,
        updatedBy,
        userConfirmed,
      })
      return reply.status(200).send({ success, message })
    }
  )
}
