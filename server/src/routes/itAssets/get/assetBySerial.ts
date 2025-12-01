import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import {
  DatabaseError,
  NotFoundError,
  ValidationError,
} from '../../../errors/errorTypes'
import { getAssetBySerial } from '../../../functions/itAssets/getAssetBySerial'

export const assetBySerial: FastifyPluginAsyncZod = async app => {
  app.get(
    '/assetBySerial',
    {
      schema: {
        querystring: z.object({
          serialNumber: z.string().min(2, ERROR_MESSAGES.INVALID_SERIAL_NUMBER),
        }),
        response: {
          200: z.object({
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
            createdAt: asset.createdAt.toString(),
            createdBy: asset.createdBy,
          })),
        })
      } catch (error) {
        if (
          error instanceof ValidationError ||
          error instanceof NotFoundError
        ) {
          throw error
        }
        console.log('Error fetching asset by serial:', error)
        throw error
      }
    }
  )
}
