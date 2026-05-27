import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/index.js'
import { getMyTicketById } from '../services/getMineById.js'

const commentSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  authorEmail: z.string(),
  body: z.string(),
  source: z.string(),
  createdAt: z.string().or(z.date()),
})

const attachmentSchema = z.object({
  id: z.string(),
  ticketId: z.string(),
  filename: z.string(),
  mimeType: z.string(),
  sharePointUrl: z.string(),
  createdAt: z.string().or(z.date()),
})

const errorResponse = z.object({
  success: z.literal(false),
  error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }),
})

export const getMyTicketByIdHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/tickets/mine/:id',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Get a single ticket with comments and attachments (requester-owned only)',
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
            attachments: z.array(attachmentSchema),
          }).describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          404: errorResponse.describe('Not Found'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
    },
    async (request, reply) => {
      const ticket = await getMyTicketById(request.params.id, request.user!.email)
      return reply.status(200).send(ticket)
    }
  )
}
