import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { create } from '../services/create.js'

export const createStaff: FastifyPluginAsyncZod = async app => {
  app.post(
    '/newStaff',
    {
      schema: {
        tags: ['Staff'],
        description: 'Create a new staff member',
        body: z.object({
          name: z.string().min(2, ERROR_MESSAGES.INVALID_NAME),
          email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
          department: z.string().min(2, ERROR_MESSAGES.INVALID_DEPARTMENT),
          jobTitle: z.string().min(2, ERROR_MESSAGES.INVALID_JOB_TITLE),
          createdBy: z.string().email(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
        }),
        response: {
          200: z.object({ result: z.object({ success: z.boolean(), message: z.string(), staff: z.string().nullable(), staffId: z.string() }) }).describe('Successful'),
          400: z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Bad Request'),
          401: z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Unauthorized'),
          403: z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Forbidden'),
          404: z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Not Found'),
          409: z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Conflict'),
          500: z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const { name, email, department, jobTitle, createdBy } = request.body
      if (!name.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_NAME_REQUIRED)
      if (!email.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_EMAIL_REQUIRED)
      if (!department.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_DEPARTMENT_REQUIRED)
      if (!jobTitle.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_JOB_TITLE_REQUIRED)
      const result = await create({ name, email, department, jobTitle, createdBy })
      return reply.status(200).send({ result })
    }
  )
}
