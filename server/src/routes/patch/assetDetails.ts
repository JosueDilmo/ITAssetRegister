import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../errors'
import { updateAssetDetails } from '../../functions/updateAssetDetails'

export const assetDetails: FastifyPluginAsyncZod = async app => {
  app.patch(
    '/assetDetails/:id',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Update IT asset details such as status and note',
        params: z.object({
          id: z.string().uuid(ERROR_MESSAGES.INVALID_ID),
        }),
        body: z.object({
          status: z.string().min(2, ERROR_MESSAGES.INVALID_STATUS),
          note: z.string().min(10, ERROR_MESSAGES.INVALID_NOTE).nullable(),
          updatedBy: z.string().email(ERROR_MESSAGES.UPDATED_BY_REQUIRED),
        }),
        response: {
          200: z
            .object({
              success: z.boolean(),
              message: z.string(),
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
      const assetID = request.params.id
      const { status, note, updatedBy } = request.body
      if (!status.trim()) {
        throw new ValidationError(ERROR_MESSAGES.ASSET_STATUS_REQUIRED)
      }
      if (!updatedBy.trim()) {
        throw new ValidationError(ERROR_MESSAGES.UPDATED_BY_REQUIRED)
      }

      const result = await updateAssetDetails({
        id: assetID,
        status: status,
        note: note,
        updatedBy: updatedBy,
      })
      return reply
        .status(200)
        .send({ success: result.success, message: result.message })
    }
  )
}
