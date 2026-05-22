import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'
import { env } from '../../../env.js'
import { ERROR_MESSAGES, NotFoundError } from '../../../errors/index.js'
import { sendMail } from '../../../shared/services/graphMailClient.js'
import { formatTicketLabel } from './ingest.js'

interface UpdateTicketParams {
  id: string
  priority?: string
  status?: string
  assignedAgentEmail?: string | null
  completionNote?: string | null
}

export async function updateTicket({ id, priority, status, assignedAgentEmail, completionNote }: UpdateTicketParams) {
  const [existing] = await db.select().from(ticketsTab).where(eq(ticketsTab.id, id))
  if (!existing) throw new NotFoundError(ERROR_MESSAGES.TICKET_NOT_FOUND)

  const updateFields: {
    updatedAt: Date
    priority?: string
    status?: string
    assignedAgentEmail?: string | null
    completionNote?: string | null
  } = { updatedAt: new Date() }

  if (priority !== undefined) updateFields.priority = priority
  if (status !== undefined) updateFields.status = status
  if (assignedAgentEmail !== undefined) updateFields.assignedAgentEmail = assignedAgentEmail
  if (completionNote !== undefined) updateFields.completionNote = completionNote

  await db.update(ticketsTab).set(updateFields).where(eq(ticketsTab.id, id))

  const ticketLabel = formatTicketLabel(existing.ticketNumber)

  if (status === 'COMPLETE') {
    const note = completionNote ?? existing.completionNote ?? 'Issue resolved.'
    await sendMail({
      to: existing.requesterEmail,
      subject: `[${ticketLabel}] Resolved: ${existing.subject}`,
      htmlBody: `
        <p>Hi,</p>
        <p>Your support ticket <strong>${ticketLabel}</strong> has been resolved.</p>
        <p><strong>Resolution:</strong><br/>${note}</p>
        <p>If you need further help, please open a new ticket by emailing <a href="mailto:${env.SUPPORT_EMAIL}">${env.SUPPORT_EMAIL}</a>.</p>
        <p>IT Support Team</p>
      `,
    })
  }

  return { success: true, message: 'Ticket updated successfully' }
}
