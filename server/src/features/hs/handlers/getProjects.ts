import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { requireAnyRole } from '../../../hooks/requireRole.js'
import { HS_ROLES } from '../hsRoles.js'
import { listProjects } from '../services/listProjects.js'

const errorResponse = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
})

export const getProjectsHandler: FastifyPluginAsyncZod = async app => {
  app.get(
    '/hs/projects',
    {
      schema: {
        tags: ['H&S'],
        description:
          'Open project folders (M&E 01_Proj/Open, names starting PR) for the H&S project picker. Cached 10 minutes; serves the last good list, flagged stale, when SharePoint is unreachable.',
        response: {
          200: z
            .object({
              projects: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  code: z.string(),
                  webUrl: z.string(),
                })
              ),
              cachedAt: z.string(),
              stale: z.boolean(),
            })
            .describe('Successful'),
          401: errorResponse.describe('Unauthorized'),
          403: errorResponse.describe('Forbidden'),
          500: errorResponse.describe('Internal Server Error'),
          503: errorResponse.describe(
            'Service Unavailable (H&S not configured, or SharePoint unreachable with no cached list)'
          ),
        },
      },
      preHandler: [requireAnyRole(HS_ROLES)],
    },
    async (_request, reply) => {
      return reply.status(200).send(await listProjects())
    }
  )
}
