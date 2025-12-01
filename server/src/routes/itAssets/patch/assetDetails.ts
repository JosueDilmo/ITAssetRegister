import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { ValidationError } from '../../../errors/errorTypes'
import { updateAssetDetails } from '../../../functions/itAssets/updateAssetDetails'

export const assetDetails: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/assetDetails/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(ERROR_MESSAGES.INVALID_ID),
        }),
        body: z.object({
          status: z.string().min(2, ERROR_MESSAGES.INVALID_STATUS),
          note: z.string().min(10, ERROR_MESSAGES.INVALID_NOTE).nullable(),
          updatedBy: z.string().email(ERROR_MESSAGES.MISSING_UPDATED_BY),
        }),
        response: {
          201: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
          500: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      try {
        const assetID = request.params.id
        const { status, note, updatedBy } = request.body
        if (!status.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_STATUS_REQUIRED)
        }
        if (!updatedBy.trim()) {
          throw new ValidationError(ERROR_MESSAGES.MISSING_UPDATED_BY)
        }

        const result = await updateAssetDetails({
          id: assetID,
          status: status,
          note: note,
          updatedBy: updatedBy,
        })
        return reply
          .status(201)
          .send({ success: result.success, message: result.message })
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error
        }
        console.error('Error in editing asset details', error)
        throw error
      }
    }
  )
}
