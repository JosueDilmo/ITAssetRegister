import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { updateTicket } from '../services/update.js'

const errorResponse = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) })

export const updateTicketHandler: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/tickets/:id',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Update ticket fields: priority, status, assignedAgentEmail, completionNote',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        body: z.object({
          priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
          status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETE']).optional(),
          assignedAgentEmail: z.string().email().nullable().optional(),
          completionNote: z.string().nullable().optional(),
        }),
        response: {
          200: z.object({ success: z.boolean(), message: z.string() }).describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          403: errorResponse.describe('Forbidden'),
          404: errorResponse.describe('Not Found'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const result = await updateTicket({ id: request.params.id, ...request.body })
      return reply.status(200).send(result)
    }
  )
}
