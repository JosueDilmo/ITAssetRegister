import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import { getTicketById } from './getById.js'

export async function getMyTicketById(id: string, requesterEmail: string) {
  const ticket = await getTicketById(id)
  if (ticket.requesterEmail !== requesterEmail) {
    throw new NotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND)
  }
  return ticket
}
