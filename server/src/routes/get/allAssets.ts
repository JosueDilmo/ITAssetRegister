import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES } from '../../errors'
import { getAsset } from '../../functions/getAsset'

export const allAssets: FastifyPluginAsyncZod = async app => {
  app.get(
    '/allAssets',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Get all IT assets or a specific asset by ID',
        querystring: z.object({
          id: z.string().uuid(ERROR_MESSAGES.INVALID_ID).optional(),
        }),
        response: {
          200: z
            .object({
              assetList: z.array(
                z.object({
                  id: z.string().uuid(),
                  serialNumber: z.string(),
                  name: z.string(),
                  type: z.string(),
                  maker: z.string(),
                  assignedTo: z.string().nullable(),
                  dateAssigned: z.string().nullable(),
                  datePurchased: z.string(),
                  assetNumber: z.string(),
                  status: z.string(),
                  note: z.string().nullable(),
                  createdAt: z.string(),
                  createdBy: z.string(),
                  changeLog: z.array(
                    z.object({
                      updatedBy: z.string(),
                      updatedAt: z.string(),
                      updatedField: z.string(),
                      previousValue: z.array(z.string().nullable()),
                      newValue: z.array(z.string().nullable()),
                    })
                  ),
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
      const { id } = request.query
      const { assetList } = await getAsset()

      const filteredAsset = id
        ? assetList.filter(asset => asset.id === id)
        : assetList

      return reply.status(200).send({
        assetList: filteredAsset.map(asset => {
          return {
            id: asset.id,
            serialNumber: asset.serialNumber,
            name: asset.name,
            type: asset.type,
            maker: asset.maker,
            assignedTo: asset.assignedTo,
            dateAssigned: asset.dateAssigned,
            datePurchased: asset.datePurchased,
            assetNumber: asset.assetNumber,
            status: asset.status,
            note: asset.note,
            createdAt: asset.createdAt.toISOString(),
            createdBy: asset.createdBy,
            changeLog: asset.changeLog.map(log => ({
              updatedBy: log.updatedBy,
              updatedAt: log.updatedAt,
              updatedField: log.updatedField,
              previousValue: log.previousValue,
              newValue: log.newValue,
            })),
          }
        }),
      })
    }
  )
}
