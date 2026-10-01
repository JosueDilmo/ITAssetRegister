import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { getAll } from '../services/getAll.js'

export const getAllLicences: FastifyPluginAsyncZod = async app => {
  app.get(
    '/allLicences',
    {
      schema: {
        tags: ['Licences'],
        description: 'Get all licences with pagination and search',
        querystring: z.object({
          search: z.string().optional(),
          orderBy: z.enum(['name']).default('name'),
          page: z.coerce.number().int().positive().default(1),
          limit: z.coerce.number().int().positive().max(100).default(25),
        }),
        response: {
          200: z
            .object({
              total: z.number(),
              page: z.number(),
              limit: z.number(),
              licenceList: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  vendor: z.string(),
                  licenceType: z.string(),
                  serialNumber: z.string().nullable(),
                  licenceNumber: z.string(),
                  datePurchased: z.string(),
                  expiryDate: z.string().nullable(),
                  seatsTotal: z.number(),
                  cost: z.string().nullable(),
                  assignedTo: z.string().nullable(),
                  dateAssigned: z.string().nullable(),
                  status: z.string(),
                  note: z.string().nullable(),
                  createdAt: z.string(),
                  createdBy: z.string(),
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
            .describe('Bad Request'),
          401: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Unauthorized'),
          403: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Forbidden'),
          404: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Not Found'),
          500: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Internal Server Error'),
        },
      },
    },
    async (request, reply) => {
      const { search, page, limit } = request.query
      const { licenceList, total } = await getAll({ search, page, limit })

      return reply.status(200).send({
        total,
        page,
        limit,
        licenceList: licenceList.map(licence => ({
          ...licence,
          createdAt: licence.createdAt.toISOString(),
        })),
      })
    }
  )
}
