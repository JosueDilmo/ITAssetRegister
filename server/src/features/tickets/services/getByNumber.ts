import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'

export async function getTicketByNumber(ticketNumber: number) {
  const [ticket] = await db.select().from(ticketsTab).where(eq(ticketsTab.ticketNumber, ticketNumber))
  if (!ticket) throw new NotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND)
  return ticket
}
