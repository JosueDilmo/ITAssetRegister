import type { FastifyInstance } from 'fastify'
import { addCommentHandler } from './handlers/addComment.js'
import { getAllTicketsHandler } from './handlers/getAll.js'
import { getTicketByIdHandler } from './handlers/getById.js'
import { ingestTicketHandler } from './handlers/ingest.js'
import { updateTicketHandler } from './handlers/update.js'

export async function ticketRoutes(app: FastifyInstance) {
  app.register(ingestTicketHandler)
  app.register(getAllTicketsHandler)
  app.register(getTicketByIdHandler)
  app.register(updateTicketHandler)
  app.register(addCommentHandler)
}
