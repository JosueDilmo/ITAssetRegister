import striptags from 'striptags'
import he from 'he'
import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'
import { env } from '../../../env.js'
import { sendMail } from '../../../shared/services/graphMailClient.js'

const SIGNATURE_DELIMITERS = /(\r?\n--\s*\r?\n|\r?\n_{3,}\r?\n|kind regards[,.]?|best regards[,.]?|regards[,.]?|many thanks[,.]?|thanks[,.]?)/i

function stripSignature(text: string): string {
  const match = SIGNATURE_DELIMITERS.exec(text)
  return match ? text.slice(0, match.index).trim() : text.trim()
}

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

  const decoded = Buffer.from(description, 'base64').toString('utf-8')
  const plainText = he.decode(striptags(decoded)).replace(/[​]/g, '').replace(/\s+/g, ' ').trim()
  const cleanDescription = stripSignature(plainText)

  const [ticket] = await db
    .insert(ticketsTab)
    .values({ subject, description: cleanDescription, requesterEmail, requesterStaffId })
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
      <p><strong>Description:</strong><br/>${cleanDescription}</p>
      <p>You can track your ticket at: <a href="${env.APP_BASE_URL}/tickets/${ticket.id}">${env.APP_BASE_URL}/tickets/${ticket.id}</a></p>
    `,
  })

  return { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, ticketLabel }
}
