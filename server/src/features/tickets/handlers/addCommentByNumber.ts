import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { env } from '../../../env.js'
import { AuthorizationError, ERROR_MESSAGES } from '../../../errors/index.js'
import { addComment } from '../services/addComment.js'
import { getTicketByNumber } from '../services/getByNumber.js'

const errorResponse = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }),
})

export const addCommentByNumberHandler: FastifyPluginAsyncZod = async app => {
  app.post(
    '/tickets/by-number/:ticketNumber/comments',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Add an email reply as a comment on a ticket (Power Automate)',
        params: z.object({ ticketNumber: z.coerce.number().int().positive() }),
        body: z.object({
          body: z.string().min(1),
          authorEmail: z.string().email(),
        }),
        response: {
          200: z.object({
            id: z.string(),
            ticketId: z.string(),
            authorEmail: z.string(),
            body: z.string(),
            source: z.string(),
            createdAt: z.string().or(z.date()),
          }).describe('Successful'),
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
      const comment = await addComment({
        ticketId: ticket.id,
        authorEmail: request.body.authorEmail,
        body: request.body.body,
        source: 'email',
      })
      return reply.status(200).send(comment)
    }
  )
}
