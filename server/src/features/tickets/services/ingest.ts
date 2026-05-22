import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'
import { env } from '../../../env.js'
import { sendMail } from '../../../shared/services/graphMailClient.js'

interface IngestTicketParams {
  subject: string
  description: string
  requesterEmail: string
}

export function formatTicketLabel(ticketNumber: number): string {
  return `TKT-${String(ticketNumber).padStart(4, '0')}`
}

export async function ingestTicket({ subject, description, requesterEmail }: IngestTicketParams) {
  const staffResult = await db
    .select({ id: staffTab.id })
    .from(staffTab)
    .where(eq(staffTab.email, requesterEmail))

  const requesterStaffId = staffResult[0]?.id ?? null

  const [ticket] = await db
    .insert(ticketsTab)
    .values({ subject, description, requesterEmail, requesterStaffId })
    .returning()

  const ticketLabel = formatTicketLabel(ticket.ticketNumber)

  await sendMail({
    to: requesterEmail,
    subject: `[${ticketLabel}] Ticket received: ${subject}`,
    htmlBody: `
      <p>Hi,</p>
      <p>Your support ticket has been received. Our team will be in touch shortly.</p>
      <p><strong>Reference:</strong> ${ticketLabel}<br/>
      <strong>Subject:</strong> ${subject}</p>
      <p><strong>Description:</strong><br/>${description}</p>
      <p>You can track your ticket at: <a href="${env.APP_BASE_URL}/tickets/${ticket.id}">${env.APP_BASE_URL}/tickets/${ticket.id}</a></p>
      <p>IT Support Team</p>
    `,
  })

  return { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, ticketLabel }
}
