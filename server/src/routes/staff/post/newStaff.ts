import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { ValidationError } from '../../../errors/errorTypes'
import { createStaff } from '../../../functions/staff/createStaff'

export const newStaff: FastifyPluginAsyncZod = async app => {
  app.post(
    '/newStaff',
    {
      schema: {
        body: z.object({
          name: z.string().min(2, ERROR_MESSAGES.INVALID_NAME),
          email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
          department: z.string().min(2, ERROR_MESSAGES.INVALID_DEPARTMENT),
          jobTitle: z.string().min(2, ERROR_MESSAGES.INVALID_JOB_TITLE),
          createdBy: z.string().email(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS),
        }),
        response: {
          201: z.object({
            success: z.boolean(),
            message: z.string(),
            staff: z.string(),
          }),
          500: z.object({
            success: z.boolean(),
            message: z.string(),
            staff: z.string().nullable(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
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
        return reply.status(201).send({
          success: result.success,
          message: result.message,
          staff: result.staff,
        })
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }

        console.error('Error creating staff:', error)
        throw error
      }
    }
  )
}
