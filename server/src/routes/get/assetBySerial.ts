import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../errors'
import { NotFoundError, ValidationError } from '../../errors/errorTypes'
import { getAssetBySerial } from '../../functions/getAssetBySerial'

export const assetBySerial: FastifyPluginAsyncZod = async app => {
  app.get(
    '/assetBySerial',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Get an IT asset by its serial number',
        querystring: z.object({
          serialNumber: z.string().min(2, ERROR_MESSAGES.INVALID_SERIAL_NUMBER),
        }),
        response: {
          200: z
            .object({
              success: z.boolean(),
              message: z.string(),
              assetList: z.array(
                z.object({
                  id: z.string(),
                  serialNumber: z.string(),
                  name: z.string(),
                  type: z.string(),
                  maker: z.string(),
                  assignedTo: z.string().nullable(),
                  datePurchased: z.string(),
                  assetNumber: z.string(),
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
      const { serialNumber } = request.query
      if (!serialNumber.trim()) {
        throw new ValidationError(ERROR_MESSAGES.ASSET_SERIAL_REQUIRED)
      }
      const { success, message, assetList } = await getAssetBySerial({
        serialNumber,
      })

      return reply.status(200).send({
        success,
        message,
        assetList: assetList.map(asset => ({
          id: asset.id,
          serialNumber: asset.serialNumber,
          name: asset.name,
          type: asset.type,
          maker: asset.maker,
          assignedTo: asset.assignedTo,
          datePurchased: asset.datePurchased,
          assetNumber: asset.assetNumber,
          status: asset.status,
          note: asset.note,
          createdAt: asset.createdAt.toISOString(),
          createdBy: asset.createdBy,
        })),
      })
    }
  )
}
