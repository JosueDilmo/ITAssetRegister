import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { addComment } from '../services/addComment.js'

const errorResponse = z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) })

export const addCommentHandler: FastifyPluginAsyncZod = async app => {
  app.post(
    '/tickets/:id/comments',
    {
      schema: {
        tags: ['Tickets'],
        description: 'Add a comment to a ticket and notify the requester by email',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        body: z.object({ body: z.string().min(1) }),
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
          403: errorResponse.describe('Forbidden'),
          404: errorResponse.describe('Not Found'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const comment = await addComment({
        ticketId: request.params.id,
        authorEmail: request.user!.email,
        body: request.body.body,
      })
      return reply.status(200).send(comment)
    }
  )
}
