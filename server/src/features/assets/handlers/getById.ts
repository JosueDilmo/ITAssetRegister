import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { getById } from '../services/getById.js'

export const getAssetById: FastifyPluginAsyncZod = async app => {
  app.get(
    '/assetWith/:id',
    {
      schema: {
        tags: ['IT Assets'],
        summary: 'Get asset by ID',
        description: 'Retrieve full asset details including change log by UUID',
        params: z.object({ id: z.string().uuid(ERROR_MESSAGES.ASSET_ID_REQUIRED) }),
        response: {
          200: z.object({
            assetDetails: z.array(
              z.object({
                id: z.string().uuid(),
                serialNumber: z.string(),
                name: z.string(),
                type: z.string(),
                maker: z.string(),
                condition: z.string(),
                assignedTo: z.string().nullable(),
                dateAssigned: z.string().nullable(),
                datePurchased: z.string(),
                assetNumber: z.string(),
                status: z.string(),
                note: z.string().nullable(),
                createdAt: z.string(),
                createdBy: z.string(),
                changeLog: z.array(z.object({
                  updatedBy: z.string(),
                  updatedAt: z.string(),
                  updatedField: z.string(),
                  previousValue: z.array(z.string().nullable()),
                  newValue: z.array(z.string().nullable()),
                })),
              })
            ),
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
      if (!id) throw new ValidationError(ERROR_MESSAGES.INVALID_ID)
      const { asset } = await getById({ id })
      return reply.status(200).send({
        assetDetails: asset.map(a => ({
          ...a,
          createdAt: a.createdAt.toISOString(),
        })),
      })
    }
  )
}
