import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { getMyTickets } from '../services/getMine.js'

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

const errorResponse = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }),
})

export const getMyTicketsHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/tickets/mine',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Get all tickets submitted by the authenticated user',
        response: {
          200: z.object({ tickets: z.array(ticketSchema) }).describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
    },
    async (request, reply) => {
      const tickets = await getMyTickets(request.user!.email)
      return reply.status(200).send({ tickets })
    }
  )
}
