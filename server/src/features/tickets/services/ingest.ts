import striptags from 'striptags'
import he from 'he'
import { eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { staffTab } from '../../../drizzle/schema/staffTab.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'
import { ticketCommentsTab } from '../../../drizzle/schema/ticketCommentsTab.js'
import { ticketAttachmentsTab } from '../../../drizzle/schema/ticketAttachmentsTab.js'
import { env } from '../../../env.js'
import { sendMail } from '../../../shared/services/graphMailClient.js'
import { uploadToSharePoint } from '../../../shared/services/graphSharePointClient.js'

const SIG_HTML_MARKER = '<!-- SIG_START -->'
const TICKET_REF_REGEX = /TKT-(\d{4})/i

function stripSignature(html: string): string {
  const markerIdx = html.indexOf(SIG_HTML_MARKER)
  return markerIdx !== -1 ? html.slice(0, markerIdx) : html
}

function cleanBody(description: string, attachments: AttachmentInput[]): string {
  const decoded = Buffer.from(description, 'base64').toString('utf-8')
  const bodyHtml = stripSignature(decoded)

  const cidToFilename = new Map<string, string>()
  for (const att of attachments) {
    if (att.contentId) cidToFilename.set(att.contentId, att.name)
  }

  const annotated = bodyHtml.replace(
    /<img[^>]+src="cid:([^"]+)"[^>]*\/?>/gi,
    (_, cid) => `[📎 ${cidToFilename.get(cid) ?? cid.split('@')[0]}]`
  )

  const withNewlines = annotated
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li|tr|h[1-6]|blockquote)>/gi, '\n')

  return he.decode(striptags(withNewlines))
    .replace(/​/g, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

async function uploadAttachments(
  ticketId: string,
  attachments: AttachmentInput[]
): Promise<{ ticketId: string; filename: string; sharePointUrl: string; mimeType: string }[]> {
  const uploaded: { ticketId: string; filename: string; sharePointUrl: string; mimeType: string }[] = []
  for (const att of attachments) {
    try {
      const sharePointUrl = await uploadToSharePoint({
        siteId: env.SHAREPOINT_SITE_ID,
        driveId: env.SHAREPOINT_DRIVE_ID,
        folderPath: `IT-Tickets/${ticketId}`,
        filename: att.name,
        contentBytes: att.contentBytes,
        mimeType: att.contentType,
      })
      uploaded.push({ ticketId, filename: att.name, sharePointUrl, mimeType: att.contentType })
    } catch (err) {
      console.error(`Attachment upload failed for ticket ${ticketId}, file ${att.name}:`, err)
    }
  }
  return uploaded
}

interface AttachmentInput {
  name: string
  contentBytes: string
  contentType: string
  contentId?: string
}

interface IngestTicketParams {
  subject: string
  description: string
  requesterEmail: string
  attachments?: AttachmentInput[]
}

export function formatTicketLabel(ticketNumber: number): string {
  return `TKT-${String(ticketNumber).padStart(4, '0')}`
}

export async function ingestTicket({
  subject,
  description,
  requesterEmail,
  attachments = [],
}: IngestTicketParams) {
  const cleanDescription = cleanBody(description, attachments)

  // If subject contains TKT-XXXX, treat as reply — add comment to existing ticket
  const refMatch = subject.match(TICKET_REF_REGEX)
  if (refMatch) {
    const ticketNumber = parseInt(refMatch[1], 10)
    const [existing] = await db
      .select({ id: ticketsTab.id, ticketNumber: ticketsTab.ticketNumber })
      .from(ticketsTab)
      .where(eq(ticketsTab.ticketNumber, ticketNumber))

    if (existing) {
      await db.insert(ticketCommentsTab).values({
        ticketId: existing.id,
        authorEmail: requesterEmail,
        body: cleanDescription,
        source: 'email',
      })

      const uploaded = await uploadAttachments(existing.id, attachments)
      if (uploaded.length > 0) {
        await db.insert(ticketAttachmentsTab).values(uploaded)
      }

      const ticketLabel = formatTicketLabel(existing.ticketNumber)
      return { ticketId: existing.id, ticketNumber: existing.ticketNumber, ticketLabel }
    }
  }

  // No matching ticket reference — create new ticket
  const staffResult = await db
    .select({ id: staffTab.id })
    .from(staffTab)
    .where(eq(staffTab.email, requesterEmail))

  const requesterStaffId = staffResult[0]?.id ?? null

  const [ticket] = await db
    .insert(ticketsTab)
    .values({ subject, description: cleanDescription, requesterEmail, requesterStaffId })
    .returning()

  const ticketLabel = formatTicketLabel(ticket.ticketNumber)

  const uploaded = await uploadAttachments(ticket.id, attachments)
  if (uploaded.length > 0) {
    await db.insert(ticketAttachmentsTab).values(uploaded)
  }

  const attachmentLinksHtml =
    uploaded.length > 0
      ? `<p><strong>Attachments:</strong><br/>${uploaded
          .map(a => `<a href="${a.sharePointUrl}">${he.encode(a.filename)}</a>`)
          .join('<br/>')}</p>`
      : ''

  await sendMail({
    to: requesterEmail,
    subject: `[${ticketLabel}] Ticket received: ${subject}`,
    htmlBody: `
      <p>Hi,</p>
      <p>Your support ticket has been received. Our team will be in touch shortly.</p>
      <p><strong>Reference:</strong> ${ticketLabel}<br/>
      <strong>Subject:</strong> ${subject}</p>
      <p><strong>Description:</strong><br/>${he.encode(cleanDescription).replace(/\n/g, '<br/>')}</p>
      ${attachmentLinksHtml}
      <p>You can track your ticket at: <a href="${env.APP_BASE_URL}/tickets/${ticket.id}">${env.APP_BASE_URL}/tickets/${ticket.id}</a></p>
    `,
  })

  return { ticketId: ticket.id, ticketNumber: ticket.ticketNumber, ticketLabel }
}
