import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/index.js'
import { getByEmail } from '../services/getByEmail.js'

export const getStaffByEmail: FastifyPluginAsyncZod = async app => {
  app.get(
    '/staffByEmail/:email',
    {
      schema: {
        tags: ['Staff'],
        summary: 'Get staff member by email',
        description:
          'Resolve a staff member (id, name, email) from an email address. 404 when no staff record has that email.',
        params: z.object({
          email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
        }),
        response: {
          200: z
            .object({
              staff: z.object({
                id: z.string().uuid(),
                name: z.string(),
                email: z.string(),
              }),
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
    },
    async (request, reply) => {
      const { email } = request.params
      const { staff } = await getByEmail({ email })
      return reply.status(200).send({ staff })
    }
  )
}
