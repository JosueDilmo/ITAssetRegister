import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { getLicencesByStaff } from '../services/getLicencesByStaff.js'

export const getLicencesByStaffHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/licencesByStaff/:email',
    {
      schema: {
        tags: ['Licences'],
        description:
          'Get all licences assigned to a staff member. An empty list is returned when none are held (404 only for an unknown staff email).',
        params: z.object({
          email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
        }),
        response: {
          200: z
            .object({
              success: z.boolean(),
              message: z.string(),
              licenceList: z.array(
                z.object({
                  id: z.string().uuid(),
                  licenceNumber: z.string(),
                  name: z.string(),
                })
              ),
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
            .describe('Staff member not found'),
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
      const { email } = request.params
      const result = await getLicencesByStaff({ staffEmail: email })
      return reply.status(200).send(result)
    }
  )
}
