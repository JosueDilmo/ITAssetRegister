import { asc, eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { ticketAttachmentsTab } from '../../../drizzle/schema/ticketAttachmentsTab.js'
import { ticketCommentsTab } from '../../../drizzle/schema/ticketCommentsTab.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'

export async function getTicketById(id: string) {
  const [ticket] = await db.select().from(ticketsTab).where(eq(ticketsTab.id, id))

  if (!ticket) throw new NotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND)

  const comments = await db
    .select()
    .from(ticketCommentsTab)
    .where(eq(ticketCommentsTab.ticketId, id))
    .orderBy(asc(ticketCommentsTab.createdAt))

  const attachments = await db
    .select()
    .from(ticketAttachmentsTab)
    .where(eq(ticketAttachmentsTab.ticketId, id))
    .orderBy(asc(ticketAttachmentsTab.createdAt))

  return { ...ticket, comments, attachments }
}
