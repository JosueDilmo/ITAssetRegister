import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { getStaff } from '../../../functions/staff/getStaff'

export const allStaff: FastifyPluginAsyncZod = async app => {
  app.get(
    '/allStaff',
    {
      schema: {
        querystring: z.object({
          id: z.string().uuid(ERROR_MESSAGES.INVALID_ID).optional(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.string(),
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
          500: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.any().optional(),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.query
        const { staffList } = await getStaff()

        const filteredStaffList = id
          ? staffList.filter(staff => staff.id === id)
          : staffList

        return reply.status(200).send(
          filteredStaffList.map(staff => {
            return {
              id: staff.id,
              name: staff.name,
              email: staff.email,
              department: staff.department,
              jobTitle: staff.jobTitle,
              status: staff.status,
              note: staff.note,
              assetHistoryList: staff.assetHistoryList,
              createdAt: staff.createdAt.toString(),
              createdBy: staff.createdBy,
              changeLog: staff.changeLog.map(log => ({
                updatedBy: log.updatedBy,
                updatedAt: log.updatedAt.toString(),
                updatedField: log.updatedField,
                previousValue: log.previousValue,
                newValue: log.newValue,
              })),
            }
          })
        )
      } catch (error) {
        console.error('Error fetching staff:', error)
        throw error
      }
    }
  )
}
