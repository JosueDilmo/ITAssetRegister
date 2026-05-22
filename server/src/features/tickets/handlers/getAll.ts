import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireRole } from '../../../hooks/requireRole.js'
import { getAllTickets } from '../services/getAll.js'

const ticketSchema = z.object({
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
})

const errorResponse = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) })

export const getAllTicketsHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/tickets',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Get all tickets with optional filters',
        querystring: z.object({
          status: z.enum(['NEW', 'IN_PROGRESS', 'COMPLETE']).optional(),
          priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
          assignedAgentEmail: z.string().email().optional(),
        }),
        response: {
          200: z.object({ tickets: z.array(ticketSchema) }).describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          403: errorResponse.describe('Forbidden'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const tickets = await getAllTickets(request.query)
      return reply.status(200).send({ tickets })
    }
  )
}
