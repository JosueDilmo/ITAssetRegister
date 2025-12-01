import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { ValidationError } from '../../../errors/errorTypes'
import { assignAssetToStaffWithConfirmation } from '../../../functions/itAssets/assignAssetToStaffWithConfirmation'

export const assetToStaff: FastifyPluginAsyncZod = async app => {
  app.post(
    '/assetToStaff/:email',
    {
      schema: {
        params: z.object({
          email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
        }),
        body: z.object({
          assetId: z.string().uuid(ERROR_MESSAGES.INVALID_ID),
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
        const staffEmail = request.params.email
        const userConfirmed = request.body.userConfirmed || false
        const assetId = request.body.assetId
        const updatedBy = request.body.updatedBy

        if (!staffEmail.trim()) {
          throw new ValidationError(ERROR_MESSAGES.STAFF_EMAIL_REQUIRED)
        }

        if (!assetId.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_ID_REQUIRED)
        }

        if (!updatedBy.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_UPDATED_BY_REQUIRED)
        }

        const result = await assignAssetToStaffWithConfirmation({
          staffEmail,
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
        throw error
      }
    }
  )
}
