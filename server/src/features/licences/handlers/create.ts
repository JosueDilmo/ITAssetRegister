import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { LICENCE_TYPE } from '../../../constants/licenceEnums.js'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { requireRole } from '../../../hooks/requireRole.js'
import { create } from '../services/create.js'

export const createLicence: FastifyPluginAsyncZod = async app => {
  app.post(
    '/newLicence',
    {
      schema: {
        tags: ['Licences'],
        description: 'Create a new software licence',
        body: z.object({
          name: z.string().min(2, ERROR_MESSAGES.INVALID_NAME),
          vendor: z.string().min(2, ERROR_MESSAGES.LICENCE_VENDOR_REQUIRED),
          licenceType: z.enum(LICENCE_TYPE, {
            message: ERROR_MESSAGES.INVALID_LICENCE_TYPE,
          }),
          licenceKey: z.string().nullable(),
          serialNumber: z.string().nullable().optional(),
          licenceNumber: z
            .string()
            .startsWith('LIC-', ERROR_MESSAGES.INVALID_LICENCE_NUMBER),
          datePurchased: z.string().date(ERROR_MESSAGES.INVALID_DATE),
          expiryDate: z.string().date(ERROR_MESSAGES.INVALID_DATE).nullable(),
          cost: z.string().nullable(),
          assignedTo: z.string().email().nullable(),
          createdBy: z.string().email(),
        }),
        response: {
          200: z
            .object({
              result: z.object({
                success: z.boolean(),
                message: z.string(),
                staff: z.string().nullable(),
                licenceId: z.string(),
              }),
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
            .describe('Bad Request'),
          401: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Unauthorized'),
          403: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Forbidden'),
          404: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Not Found'),
          409: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Conflict'),
          500: z
            .object({
              success: z.boolean(),
              error: z.object({
                code: z.string(),
                message: z.string(),
                details: z.any().optional(),
              }),
            })
            .describe('Internal Server Error'),
        },
      },
      preHandler: [requireRole('admin')],
    },
    async (request, reply) => {
      const {
        name,
        vendor,
        licenceType,
        licenceKey,
        serialNumber,
        licenceNumber,
        datePurchased,
        expiryDate,
        cost,
        assignedTo,
        createdBy,
      } = request.body
      if (!name.trim())
        throw new ValidationError(ERROR_MESSAGES.LICENCE_NAME_REQUIRED)
      if (!vendor.trim())
        throw new ValidationError(ERROR_MESSAGES.LICENCE_VENDOR_REQUIRED)
      if (!licenceNumber.trim())
        throw new ValidationError(ERROR_MESSAGES.LICENCE_NUMBER_REQUIRED)

      const result = await create({
        name,
        vendor,
        licenceType,
        licenceKey,
        serialNumber,
        licenceNumber,
        datePurchased,
        expiryDate,
        cost,
        assignedTo,
        createdBy,
      })
      return reply.status(200).send({ result })
    }
  )
}
