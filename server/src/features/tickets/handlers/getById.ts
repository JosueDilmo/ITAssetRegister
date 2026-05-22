import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { getTicketById } from '../services/getById.js'

const commentSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  authorEmail: z.string(),
  body: z.string(),
  source: z.string(),
  createdAt: z.string().or(z.date()),
})

const errorResponse = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) })

export const getTicketByIdHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/tickets/:id',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Get a single ticket with all comments',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        response: {
          200: z.object({
            id: z.string(),
            ticketNumber: z.number(),
            subject: z.string(),
            description: z.string(),
            priority: z.string(),
            status: z.string(),
            requesterEmail: z.string(),
            requesterStaffId: z.string().nullable(),
            assignedAgentEmail: z.string().nullable(),
            completionNote: z.string().nullable(),
            createdAt: z.string().or(z.date()),
            updatedAt: z.string().or(z.date()),
            comments: z.array(commentSchema),
          }).describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          403: errorResponse.describe('Forbidden'),
          404: errorResponse.describe('Not Found'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const result = await getTicketById(request.params.id)
      return reply.status(200).send(result)
    }
  )
}
