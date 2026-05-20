import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { getById } from '../services/getById.js'

export const getStaffById: FastifyPluginAsyncZod = async app => {
  app.get(
    '/staffBy/:id',
    {
      schema: {
        tags: ['Staff'],
        summary: 'Get staff member by ID',
        description: 'Retrieve full staff details including change log by UUID',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.STAFF_ID_REQUIRED) }),
        response: {
          200: z.object({
            staffDetails: z.array(z.object({
              id: z.string().uuid(),
              name: z.string(),
              email: z.string(),
              department: z.string(),
              jobTitle: z.string(),
              status: z.string(),
              note: z.string().nullable(),
              assetHistoryList: z.array(z.string().nullable()),
              createdAt: z.string(),
              createdBy: z.string(),
              changeLog: z.array(z.object({
                updatedBy: z.string(),
                updatedAt: z.string(),
                updatedField: z.string(),
                previousValue: z.array(z.string().nullable()),
                newValue: z.array(z.string().nullable()),
              })),
            })),
          }).describe('Successful'),
          400: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Bad Request'),
          401: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Unauthorized'),
          403: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Forbidden'),
          404: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Not Found'),
          500: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Internal Server Error'),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params
      if (!id) throw new ValidationError(`${ERROR_MESSAGES.INVALID_ID} ID: ${id}`)
      const { staff } = await getById({ id })
      return reply.status(200).send({
        staffDetails: staff.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })),
      })
    }
  )
}
