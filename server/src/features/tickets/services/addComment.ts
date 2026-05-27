import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { ticketCommentsTab } from '../../../drizzle/schema/ticketCommentsTab.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'
import { env } from '../../../env.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import { sendMail } from '../../../shared/services/graphMailClient.js'
import { formatTicketLabel } from './ingest.js'

interface AddCommentParams {
  ticketId: string
  authorEmail: string
  body: string
  source?: string
}

export async function addComment({ ticketId, authorEmail, body, source = 'agent' }: AddCommentParams) {
  const [ticket] = await db.select().from(ticketsTab).where(eq(ticketsTab.id, ticketId))
  if (!ticket) throw new NotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND)

  const [comment] = await db
    .insert(ticketCommentsTab)
    .values({ ticketId, authorEmail, body, source })
    .returning()

  const ticketLabel = formatTicketLabel(ticket.ticketNumber)

  if (source !== 'email') {
    await sendMail({
      to: ticket.requesterEmail,
      subject: `[${ticketLabel}] Update on your ticket: ${ticket.subject}`,
      htmlBody: `
        <p>Hi,</p>
        <p>There is a new update on your support ticket <strong>${ticketLabel}</strong>.</p>
        <p><strong>${authorEmail} wrote:</strong><br/>${body}</p>
        <p>View your ticket: <a href="${env.APP_BASE_URL}/tickets/${ticket.id}">${env.APP_BASE_URL}/tickets/${ticket.id}</a></p>
      `,
    })
  }

  return comment
}
