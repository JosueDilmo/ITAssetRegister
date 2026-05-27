import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({
  db: { select: vi.fn() },
}))

vi.mock('../../../errors/index.js', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) { super(msg); this.name = 'NotFoundError' }
  },
  ERROR_MESSAGES: { TICKET_NOT_FOUND: 'Ticket not found' },
}))

const baseTicket = {
  id: 'ticket-uuid-1',
  ticketNumber: 7,
  subject: 'Screen cracked',
  description: 'The screen is cracked.',
  priority: 'HIGH',
  status: 'NEW',
  requesterEmail: 'staff@mastertech.ie',
  requesterStaffId: null,
  assignedAgentEmail: null,
  completionNote: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('getTicketById', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns ticket with comments and attachments', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([baseTicket]),
        }),
      } as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([{
              id: 'comment-1',
              ticketId: 'ticket-uuid-1',
              authorEmail: 'agent@mastertech.ie',
              body: 'Working on it',
              source: 'agent',
              createdAt: new Date(),
            }]),
          }),
        }),
      } as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([{
              id: 'att-1',
              ticketId: 'ticket-uuid-1',
              filename: 'screenshot.png',
              mimeType: 'image/png',
              sharePointUrl: 'https://sharepoint.example.com/file.png',
              createdAt: new Date(),
            }]),
          }),
        }),
      } as any)

    const { getTicketById } = await import('./getById.js')
    const result = await getTicketById('ticket-uuid-1')

    expect(result.id).toBe('ticket-uuid-1')
    expect(result.comments).toHaveLength(1)
    expect(result.comments[0].body).toBe('Working on it')
    expect(result.attachments).toHaveLength(1)
    expect(result.attachments[0].filename).toBe('screenshot.png')
  })

  it('returns empty arrays when ticket has no comments or attachments', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([baseTicket]),
        }),
      } as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      } as any)

    const { getTicketById } = await import('./getById.js')
    const result = await getTicketById('ticket-uuid-1')

    expect(result.comments).toHaveLength(0)
    expect(result.attachments).toHaveLength(0)
  })

  it('throws NotFoundError when ticket does not exist', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    const { getTicketById } = await import('./getById.js')
    await expect(getTicketById('missing-id')).rejects.toThrow('Ticket not found')
  })
})
