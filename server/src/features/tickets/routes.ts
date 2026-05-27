import type { FastifyInstance } from 'fastify'
import { addCommentHandler } from './handlers/addComment.js'
import { addCommentByNumberHandler } from './handlers/addCommentByNumber.js'
import { getAllTicketsHandler } from './handlers/getAll.js'
import { getMyTicketByIdHandler } from './handlers/getMineById.js'
import { getMyTicketsHandler } from './handlers/getMine.js'
import { getTicketByIdHandler } from './handlers/getById.js'
import { getTicketByNumberHandler } from './handlers/getByNumber.js'
import { ingestTicketHandler } from './handlers/ingest.js'
import { updateTicketHandler } from './handlers/update.js'

export async function ticketRoutes(app: FastifyInstance) {
  app.register(ingestTicketHandler)
  app.register(getTicketByNumberHandler)
  app.register(addCommentByNumberHandler)
  app.register(getAllTicketsHandler)
  app.register(getMyTicketsHandler)
  app.register(getMyTicketByIdHandler)
  app.register(getTicketByIdHandler)
  app.register(updateTicketHandler)
  app.register(addCommentHandler)
}
