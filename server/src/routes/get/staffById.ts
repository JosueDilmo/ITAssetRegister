import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../errors'
import { getStaffById } from '../../functions/getStaffById'

export const staffById: FastifyPluginAsyncZod = async app => {
  app.get(
    '/staffBy/:id',
    {
      schema: {
        tags: ['Staff'],
        description: 'Get staff by ID',
        params: z.object({
          id: z.string().uuid(ERROR_MESSAGES.STAFF_ID_REQUIRED),
        }),
        response: {
          200: z
            .object({
              staffDetails: z.array(
                z.object({
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
                  changeLog: z.array(
                    z.object({
                      updatedBy: z.string(),
                      updatedAt: z.string(),
                      updatedField: z.string(),
                      previousValue: z.array(z.string().nullable()),
                      newValue: z.array(z.string().nullable()),
                    })
                  ),
                })
              ),
            })
            .describe('Successful'),
          400: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Bad Request - Input Validation'),
          401: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Unauthorized - Authentication'),
          403: z.object({
            success: z.boolean(),
            error: z
              .object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              })
              .describe('Forbidden - Authorization'),
          }),
          404: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Not Found - Resource Not Found'),
          409: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Conflict - Resource Conflicts'),
          500: z
            .object({
              success: z.boolean(),
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
      const { id } = request.params

      if (!id) {
        throw new ValidationError(`${ERROR_MESSAGES.INVALID_ID} ID: ${id}`)
      }

      const { staff } = await getStaffById({ id })

      return reply.status(200).send({
        staffDetails: staff.map(staff => ({
          id: staff.id,
          name: staff.name,
          email: staff.email,
          department: staff.department,
          jobTitle: staff.jobTitle,
          status: staff.status,
          note: staff.note,
          assetHistoryList: staff.assetHistoryList,
          createdAt: staff.createdAt.toISOString(),
          createdBy: staff.createdBy,
          changeLog: staff.changeLog.map(log => ({
            updatedBy: log.updatedBy,
            updatedAt: log.updatedAt,
            updatedField: log.updatedField,
            previousValue: log.previousValue,
            newValue: log.newValue,
          })),
        })),
      })
    }
  )
}
