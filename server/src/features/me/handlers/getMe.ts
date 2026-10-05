import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AuthenticationError, ERROR_MESSAGES } from '../../../errors/index.js'
import { getMe } from '../services/getMe.js'

const errorResponse = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
})

// The 200 schema is the response allowlist: plain z.object strips unknown keys
// on serialization, so nothing beyond these fields can reach the client.
const staffSchema = z.object({
  name: z.string(),
  email: z.string(),
  department: z.string(),
  jobTitle: z.string(),
  status: z.string(),
})

const assetSchema = z.object({
  id: z.string().uuid(),
  assetNumber: z.string(),
  type: z.string(),
  maker: z.string(),
  name: z.string(),
  serialNumber: z.string(),
})

const licenceSchema = z.object({
  id: z.string().uuid(),
  licenceNumber: z.string(),
  name: z.string(),
  licenceType: z.string(),
  expiryDate: z.string().nullable(),
})

export const getMeHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/me',
    {
      schema: {
        tags: ['Me'],
        description:
          "Signed-in user's own staff profile, assigned assets and assigned licences. Identity comes from the session only; the route takes no input.",
        response: {
          200: z
            .object({
              staff: staffSchema.nullable(),
              assets: z.array(assetSchema),
              licences: z.array(licenceSchema),
            })
            .describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          500: errorResponse.describe('Internal Server Error'),
        },
      },
    },
    async (request, reply) => {
      if (!request.user) {
        throw new AuthenticationError(ERROR_MESSAGES.UNAUTHENTICATED)
      }

      const result = await getMe({ email: request.user.email })
      return reply.status(200).send(result)
    }
  )
}
