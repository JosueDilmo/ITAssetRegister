import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../errors'
import { createStaff } from '../../functions/createStaff'

export const newStaff: FastifyPluginAsyncZod = async app => {
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
          200: z
            .object({
              success: z.boolean(),
              message: z.string(),
              staff: z.string(),
            })
            .describe('Successful'),
          400: z
            .object({
              success: z.literal(false),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Bad Request - Input Validation'),
          401: z
            .object({
              success: z.literal(false),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Unauthorized - Authentication'),
          403: z
            .object({
              success: z.literal(false),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Forbidden - Authorization'),
          404: z
            .object({
              success: z.literal(false),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Not Found - Resource Not Found'),
          409: z
            .object({
              success: z.literal(false),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Conflict - Resource Conflicts'),
          500: z
            .object({
              success: z.literal(false),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Internal Server Error - Unexpected Errors'),
        },
      },
    },
    async (request, reply) => {
      const { name, email, department, jobTitle, createdBy } = request.body

      if (!name.trim()) {
        throw new ValidationError(ERROR_MESSAGES.STAFF_NAME_REQUIRED)
      }

      if (!email.trim()) {
        throw new ValidationError(ERROR_MESSAGES.STAFF_EMAIL_REQUIRED)
      }

      if (!department.trim()) {
        throw new ValidationError(ERROR_MESSAGES.STAFF_DEPARTMENT_REQUIRED)
      }

      if (!jobTitle.trim()) {
        throw new ValidationError(ERROR_MESSAGES.STAFF_JOB_TITLE_REQUIRED)
      }

      const result = await createStaff({
        name,
        email,
        department,
        jobTitle,
        createdBy,
      })
      return reply.status(200).send({
        success: result.success,
        message: result.message,
        staff: result.staff,
      })
    }
  )
}
