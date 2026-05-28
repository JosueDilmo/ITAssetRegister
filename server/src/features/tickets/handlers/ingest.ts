import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { env } from '../../../env.js'
import { AuthorizationError, ERROR_MESSAGES } from '../../../errors/index.js'
import { ingestTicket } from '../services/ingest.js'

const errorResponse = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }),
})

export const ingestTicketHandler: FastifyPluginAsyncZod = async app => {
  app.post(
    '/tickets/ingest',
    {
      bodyLimit: 20 * 1024 * 1024,
      schema: {
        tags: ['Tickets'],
        description: 'Create a ticket from an incoming email (called by Power Automate)',
        body: z.object({
          subject: z.string().min(1),
          description: z.string().min(1),
          requesterEmail: z.string().email(),
          attachments: z
            .array(
              z.object({
                name: z.string().min(1),
                contentBytes: z.string().min(1),
                contentType: z.string().min(1),
                contentId: z.string().optional(),
              })
            )
            .optional()
            .default([]),
        }),
        response: {
          200: z
            .object({ ticketId: z.string(), ticketNumber: z.number(), ticketLabel: z.string() })
            .describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
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
      const { subject, description, requesterEmail, attachments } = request.body
      const result = await ingestTicket({ subject, description, requesterEmail, attachments })
      return reply.status(200).send(result)
    }
  )
}
