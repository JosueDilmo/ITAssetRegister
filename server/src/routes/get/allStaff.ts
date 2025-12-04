import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { getStaff } from '../../functions/getStaff'

export const allStaff: FastifyPluginAsyncZod = async app => {
  app.get(
    '/allStaff',
    {
      schema: {
        tags: ['Staff'],
        description: 'Get all staff or a specific staff member by ID',
        querystring: z.object({
          search: z.string().optional(),
          orderBy: z
            .enum(['name', 'department', 'email', 'createdAt'])
            .optional()
            .default('name'),
          page: z.coerce.number().optional().default(1),
        }),
        response: {
          200: z
            .object({
              staffList: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  email: z.string(),
                  department: z.string(),
                  jobTitle: z.string(),
                  status: z.string(),
                  note: z.string().nullable(),
                  assetHistoryList: z.array(z.string()),
                  createdAt: z.string(),
                  createdBy: z.string(),
                  changeLog: z.array(
                    z.object({
                      updatedBy: z.string(),
                      updatedAt: z.string(),
                      updatedField: z.string(),
                      previousValue: z.string(),
                      newValue: z.string(),
                    })
                  ),
                })
              ),
              totalPages: z.number(),
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
                details: z.string().optional(),
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
      const { search, orderBy, page } = request.query
      const { staffList, totalPages } = await getStaff({
        orderBy,
        page,
        search,
      })

      return reply.status(200).send({
        staffList: staffList.map(staff => {
          return {
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
          }
        }),
        totalPages,
      })
    }
  )
}
