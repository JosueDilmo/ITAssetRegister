import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { env } from '../../../env.js'
import { AuthorizationError, ERROR_MESSAGES } from '../../../errors/index.js'
import { getTicketByNumber } from '../services/getByNumber.js'

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

export const getTicketByNumberHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/tickets/by-number/:ticketNumber',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Get a ticket by display number (Power Automate convenience)',
        params: z.object({ ticketNumber: z.coerce.number().int().positive() }),
        response: {
          200: ticketSchema.describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          404: errorResponse.describe('Not Found'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
      preHandler: [
        async request => {
          const apiKey = request.headers['x-api-key']
          if (!apiKey || apiKey !== env.TICKET_INGEST_API_KEY) {
            throw new AuthorizationError(ERROR_MESSAGES.INVALID_API_KEY)
          }
        },
      ],
    },
    async (request, reply) => {
      const ticket = await getTicketByNumber(request.params.ticketNumber)
      return reply.status(200).send(ticket)
    }
  )
}
