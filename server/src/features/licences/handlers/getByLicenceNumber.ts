import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireRole } from '../../../hooks/requireRole.js'
import { getByLicenceNumber } from '../services/getByLicenceNumber.js'

export const getLicenceByNumber: FastifyPluginAsyncZod = async app => {
  app.get(
    '/licenceByNumber/:licenceNumber',
    {
      schema: {
        tags: ['Licences'],
        description: 'Get a licence by its internal licence number',
        params: z.object({ licenceNumber: z.string() }),
        response: {
          200: z
            .object({
              success: z.boolean(),
              message: z.string(),
              licenceDetails: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  vendor: z.string(),
                  licenceType: z.string(),
                  serialNumber: z.string().nullable(),
                  licenceNumber: z.string(),
                  assignedTo: z.string().nullable(),
                  datePurchased: z.string(),
                  expiryDate: z.string().nullable(),
                  cost: z.string().nullable(),
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
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const { licenceNumber } = request.params
      const result = await getByLicenceNumber({ licenceNumber })
      return reply.status(200).send({
        ...result,
        licenceDetails: result.licenceDetails.map(l => ({
          ...l,
          createdAt: l.createdAt.toISOString(),
        })),
      })
    }
  )
}
