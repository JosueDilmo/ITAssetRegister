import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ERROR_MESSAGES, ValidationError } from '../../../errors/index.js'
import { getByStaff } from '../services/getByStaff.js'

export const getAssetsByStaff: FastifyPluginAsyncZod = async app => {
  app.get(
    '/assetByStaff/:email',
    {
      schema: {
        tags: ['IT Assets'],
        description: 'Get IT assets assigned to a staff member by their email',
        params: z.object({ email: z.string().email(ERROR_MESSAGES.INVALID_EMAIL) }),
        response: {
          200: z.object({
            success: z.boolean(),
            message: z.string(),
            assetList: z.array(z.object({ id: z.string().uuid(), serialNumber: z.string(), name: z.string() })),
          }).describe('Successful'),
          400: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Bad Request'),
          401: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Unauthorized'),
          403: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Forbidden'),
          404: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Not Found'),
          500: z.object({ success: z.boolean(), error: z.object({ code: z.string(), message: z.string(), details: z.any().optional() }) }).describe('Internal Server Error'),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.params
      if (!email.trim()) throw new ValidationError(ERROR_MESSAGES.STAFF_EMAIL_REQUIRED)
      const result = await getByStaff({ staffEmail: email })
      return reply.status(200).send(result)
    }
  )
}
