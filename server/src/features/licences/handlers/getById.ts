import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { getById } from '../services/getById.js'

export const getLicenceById: FastifyPluginAsyncZod = async app => {
  app.get(
    '/licenceWithId/:id',
    {
      schema: {
        tags: ['Licences'],
        description: 'Get a licence by ID including changelog',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.INVALID_ID) }),
        response: {
          200: z
            .object({
              licence: z.array(
                z.object({
                  id: z.string().uuid(),
                  name: z.string(),
                  vendor: z.string(),
                  licenceType: z.string(),
                  licenceKey: z.string().nullable(),
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
                  changeLog: z.array(
                    z.object({
                      updatedBy: z.string(),
                      updatedAt: z.string(),
                      updatedField: z.string(),
                      previousValue: z.array(z.string()),
                      newValue: z.array(z.string()),
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
      const { id } = request.params
      const { licence } = await getById({ id })
      // The activation key is for IT admins only (least privilege, D-07):
      // every other caller gets the licence with licenceKey nulled out.
      // Decided from the full roles array, not the collapsed badge role (D-02).
      const isAdmin = request.user?.roles.includes('admin') ?? false
      return reply.status(200).send({
        licence: licence.map(l => ({
          ...l,
          licenceKey: isAdmin ? l.licenceKey : null,
          createdAt: l.createdAt.toISOString(),
        })),
      })
    }
  )
}
