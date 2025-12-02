import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../../errors/errorMessages'
import { DatabaseError, ValidationError } from '../../../errors/errorTypes'
import { createAsset } from '../../../functions/itAssets/createAsset'

export const newAsset: FastifyPluginAsyncZod = async app => {
  app.post(
    '/newAsset',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Create a new IT asset',
        body: z.object({
          serialNumber: z.string().min(2, ERROR_MESSAGES.INVALID_SERIAL_NUMBER),
          name: z.string().min(2, ERROR_MESSAGES.INVALID_NAME),
          type: z.string().min(2, ERROR_MESSAGES.INVALID_ASSET_TYPE),
          maker: z.string().min(2, ERROR_MESSAGES.INVALID_MAKER),
          assignedTo: z.string().email().nullable(),
          datePurchased: z.string().date(ERROR_MESSAGES.INVALID_DATE),
          assetNumber: z.string().min(2, ERROR_MESSAGES.INVALID_ASSET_NUMBER),
          createdBy: z.string().email(),
        }),
        response: {
          201: z.object({
            success: z.boolean(),
            message: z.string(),
            staff: z.string().nullable(),
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
        // Extract parameters from request body
        const {
          serialNumber,
          name,
          type,
          maker,
          assignedTo,
          datePurchased,
          assetNumber,
          createdBy,
        } = request.body

        // Validate required fields
        if (!serialNumber.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_SERIAL_REQUIRED)
        }
        if (!name.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_NAME_REQUIRED)
        }
        if (!type.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_TYPE_REQUIRED)
        }
        if (!maker.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_MAKER_REQUIRED)
        }
        if (!assetNumber.trim()) {
          throw new ValidationError(ERROR_MESSAGES.ASSET_NUMBER_REQUIRED)
        }

        // Call createAsset function with the extracted parameters
        const result = await createAsset({
          serialNumber,
          name,
          type,
          maker,
          assignedTo,
          datePurchased,
          assetNumber,
          createdBy,
        })

        if (!result) {
          throw new DatabaseError(ERROR_MESSAGES.INTERNAL_DB_ERROR)
        }

        return reply.status(201).send({
          success: result.success,
          message: result.message,
          staff: result.staff,
        })
      } catch (error) {
        if (
          error instanceof ValidationError ||
          error instanceof DatabaseError
        ) {
          throw error
        }
        console.log('Error creating new asset:', error)
        throw error
      }
    }
  )
}
