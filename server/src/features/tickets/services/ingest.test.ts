import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
  },
}))

vi.mock('../../../shared/services/graphMailClient.js', () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../../shared/services/graphSharePointClient.js', () => ({
  uploadToSharePoint: vi.fn(),
}))

vi.mock('../../../env.js', () => ({
  env: {
    SUPPORT_EMAIL: 'it.support@mastertech.ie',
    APP_BASE_URL: 'https://app.example.com',
    SHAREPOINT_SITE_ID: 'site-id',
    SHAREPOINT_DRIVE_ID: 'drive-id',
  },
}))

describe('ingestTicket', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('inserts a ticket and calls sendMail with TKT-formatted subject', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { sendMail } = await import('../../../shared/services/graphMailClient.js')

    const mockTicket = { id: 'ticket-uuid-1', ticketNumber: 1, subject: 'My laptop is broken' }

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([mockTicket]),
      }),
    } as any)

    const { ingestTicket } = await import('./ingest.js')
    const result = await ingestTicket({
      subject: 'My laptop is broken',
      description: 'Screen cracked after drop',
      requesterEmail: 'staff@mastertech.ie',
    })

    expect(result.ticketLabel).toBe('TKT-0001')
    expect(result.ticketId).toBe('ticket-uuid-1')
    expect(sendMail).toHaveBeenCalledOnce()
    const callArgs = vi.mocked(sendMail).mock.calls[0][0]
    expect(callArgs.subject).toContain('[TKT-0001]')
    expect(callArgs.to).toBe('staff@mastertech.ie')
  })

  it('uploads attachments to SharePoint and batch-inserts refs when attachments provided', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { uploadToSharePoint } = await import('../../../shared/services/graphSharePointClient.js')

    const mockTicket = { id: 'ticket-uuid-2', ticketNumber: 2, subject: 'Printer issue' }

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    vi.mocked(db.insert)
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockTicket]),
        }),
      } as any)
      .mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      } as any)

    vi.mocked(uploadToSharePoint)
      .mockResolvedValueOnce('https://sharepoint.example.com/IT-Tickets/ticket-uuid-2/screenshot1.png')
      .mockResolvedValueOnce('https://sharepoint.example.com/IT-Tickets/ticket-uuid-2/screenshot2.png')

    const { ingestTicket } = await import('./ingest.js')
    await ingestTicket({
      subject: 'Printer issue',
      description: 'UHJpbnRlciBub3Qgd29ya2luZw==',
      requesterEmail: 'staff@mastertech.ie',
      attachments: [
        { name: 'screenshot1.png', contentBytes: 'aGVsbG8=', contentType: 'image/png' },
        { name: 'screenshot2.png', contentBytes: 'd29ybGQ=', contentType: 'image/png' },
      ],
    })

    expect(uploadToSharePoint).toHaveBeenCalledTimes(2)
    expect(vi.mocked(uploadToSharePoint).mock.calls[0][0]).toMatchObject({
      siteId: 'site-id',
      driveId: 'drive-id',
      folderPath: 'IT-Tickets/ticket-uuid-2',
      filename: 'screenshot1.png',
      mimeType: 'image/png',
    })

    expect(db.insert).toHaveBeenCalledTimes(2)
    const attachmentInsertValues = vi.mocked(db.insert).mock.results[1].value.values.mock.calls[0][0]
    expect(attachmentInsertValues).toHaveLength(2)
    expect(attachmentInsertValues[0]).toMatchObject({
      ticketId: 'ticket-uuid-2',
      filename: 'screenshot1.png',
      mimeType: 'image/png',
      sharePointUrl: 'https://sharepoint.example.com/IT-Tickets/ticket-uuid-2/screenshot1.png',
    })
  })

  it('still creates ticket when one attachment upload fails', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { uploadToSharePoint } = await import('../../../shared/services/graphSharePointClient.js')
    const { sendMail } = await import('../../../shared/services/graphMailClient.js')

    const mockTicket = { id: 'ticket-uuid-3', ticketNumber: 3, subject: 'Keyboard issue' }

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    vi.mocked(db.insert)
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockTicket]),
        }),
      } as any)
      .mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      } as any)

    vi.mocked(uploadToSharePoint)
      .mockRejectedValueOnce(new Error('SharePoint upload failed: 503 Service Unavailable'))
      .mockResolvedValueOnce('https://sharepoint.example.com/IT-Tickets/ticket-uuid-3/ok.png')

    const { ingestTicket } = await import('./ingest.js')
    const result = await ingestTicket({
      subject: 'Keyboard issue',
      description: 'S2V5Ym9hcmQgYnJva2Vu',
      requesterEmail: 'staff@mastertech.ie',
      attachments: [
        { name: 'fail.png', contentBytes: 'aGVsbG8=', contentType: 'image/png' },
        { name: 'ok.png', contentBytes: 'd29ybGQ=', contentType: 'image/png' },
      ],
    })

    expect(result.ticketId).toBe('ticket-uuid-3')
    expect(sendMail).toHaveBeenCalledOnce()

    const attachmentInsertValues = vi.mocked(db.insert).mock.results[1].value.values.mock.calls[0][0]
    expect(attachmentInsertValues).toHaveLength(1)
    expect(attachmentInsertValues[0].filename).toBe('ok.png')
  })

  it('strips email signature before storing description', async () => {
    const { db } = await import('../../../drizzle/client.js')

    const emailHtml = '<div>My laptop screen cracked.</div><div><br></div><div>Kind Regards,</div><div>John Smith</div><div>IT Manager</div>'
    const description = Buffer.from(emailHtml).toString('base64')
    const mockTicket = { id: 'ticket-uuid-5', ticketNumber: 5, subject: 'Cracked screen' }

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    let insertedDescription: string | undefined
    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockImplementation((vals) => {
        insertedDescription = vals.description
        return { returning: vi.fn().mockResolvedValue([mockTicket]) }
      }),
    } as any)

    const { ingestTicket } = await import('./ingest.js')
    await ingestTicket({ subject: 'Cracked screen', description, requesterEmail: 'staff@mastertech.ie' })

    expect(insertedDescription).toBe('My laptop screen cracked.')
    expect(insertedDescription).not.toContain('John Smith')
  })

  it('confirmation email includes attachment links when uploads succeed', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { uploadToSharePoint } = await import('../../../shared/services/graphSharePointClient.js')
    const { sendMail } = await import('../../../shared/services/graphMailClient.js')

    const mockTicket = { id: 'ticket-uuid-4', ticketNumber: 4, subject: 'Monitor issue' }

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    vi.mocked(db.insert)
      .mockReturnValueOnce({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockTicket]),
        }),
      } as any)
      .mockReturnValueOnce({
        values: vi.fn().mockResolvedValue(undefined),
      } as any)

    vi.mocked(uploadToSharePoint).mockResolvedValueOnce(
      'https://sharepoint.example.com/IT-Tickets/ticket-uuid-4/photo.jpg'
    )

    const { ingestTicket } = await import('./ingest.js')
    await ingestTicket({
      subject: 'Monitor issue',
      description: 'TW9uaXRvciBibGFuaw==',
      requesterEmail: 'staff@mastertech.ie',
      attachments: [{ name: 'photo.jpg', contentBytes: 'aGVsbG8=', contentType: 'image/jpeg' }],
    })

    const emailBody = vi.mocked(sendMail).mock.calls[0][0].htmlBody
    expect(emailBody).toContain('https://sharepoint.example.com/IT-Tickets/ticket-uuid-4/photo.jpg')
    expect(emailBody).toContain('photo.jpg')
  })
})
