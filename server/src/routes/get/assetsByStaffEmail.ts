import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../errors'
import { getAssetsByStaffEmail } from '../../functions/getAssetsByStaffEmail'

export const assetsByStaffEmail: FastifyPluginAsyncZod = async app => {
  app.get(
    '/assetByStaff/:email',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Get IT assets assigned to a staff member by their email',
        params: z.object({
          email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL),
        }),
        response: {
          200: z
            .object({
              success: z.boolean(),
              message: z.string(),
              assetList: z.array(
                z.object({
                  id: z.string().uuid(),
                  serialNumber: z.string(),
                  name: z.string(),
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
                details: z.any().optional(),
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
      const { email } = request.params
      if (!email.trim()) {
        throw new ValidationError(ERROR_MESSAGES.STAFF_EMAIL_REQUIRED)
      }
      const result = await getAssetsByStaffEmail({ staffEmail: email })
      return reply.status(200).send({
        success: result.success,
        message: result.message,
        assetList: result.assetList.map(asset => ({
          id: asset.id,
          serialNumber: asset.serialNumber,
          name: asset.name,
        })),
      })
    }
  )
}
