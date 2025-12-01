import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { ValidationError } from '../../../errors/errorTypes'
import { getAssetsByStaffEmail } from '../../../functions/itAssets/getAssetsByStaffEmail'

export const assetsByStaffEmail: FastifyPluginAsyncZod = async app => {
  app.get(
    '/assetByStaffEmail',
    {
      schema: {
        querystring: z.object({
          staffEmail: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
            assetList: z.array(
              z.object({
                id: z.string().uuid(),
                serialNumber: z.string(),
                name: z.string(),
                email: z.string().nullable(),
              })
            ),
          }),
          400: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.any().optional(),
            }),
          }),
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
      // Validate query parameters
      try {
        const { staffEmail } = request.query
        if (!staffEmail.trim()) {
          throw new ValidationError(ERROR_MESSAGES.STAFF_EMAIL_REQUIRED)
        }
        const result = await getAssetsByStaffEmail({ staffEmail })
        return reply.status(200).send({
          success: result.success,
          message: result.message,
          assetList: result.assetList.map(asset => ({
            id: asset.id,
            serialNumber: asset.serialNumber,
            name: asset.name,
            email: asset.email,
          })),
        })
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        console.log('Error fetching asset by email:', error)
        throw error
      }
    }
  )
}
