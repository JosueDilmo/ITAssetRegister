import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { ValidationError } from '../../../errors/errorTypes'
import { removeAssetAssignment } from '../../../functions/itAssets/removeAssetAssignment'

export const assetById: FastifyPluginAsyncZod = async app => {
  app.delete(
    '/assetBy/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(ERROR_MESSAGES.INVALID_ID),
        }),
        querystring: z.object({
          updatedBy: z.string().email(ERROR_MESSAGES.MISSING_UPDATED_BY),
          userConfirmed: z.boolean().optional(),
        }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          400: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.any().optional(),
            }),
          }),
          404: z.object({
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
      try {
        const assetId = request.params.id
        const updatedBy = request.query.updatedBy
        const userConfirmed = request.query.userConfirmed || false

        if (!assetId) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_ID_REQUIRED)
        }

        const result = await removeAssetAssignment({
          assetId,
          updatedBy,
          userConfirmed,
        })

        return reply.status(200).send({
          success: result.success,
          message: result.message,
        })
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        console.error('Error removing asset assignment:', error)
        throw error
      }
    }
  )
}
