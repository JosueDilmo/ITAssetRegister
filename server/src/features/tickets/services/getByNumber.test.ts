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
  ticketNumber: 42,
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

describe('getTicketByNumber', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns ticket when found by ticketNumber', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([baseTicket]),
      }),
    } as any)

    const { getTicketByNumber } = await import('./getByNumber.js')
    const result = await getTicketByNumber(42)

    expect(result.id).toBe('ticket-uuid-1')
    expect(result.ticketNumber).toBe(42)
  })

  it('throws NotFoundError when ticketNumber does not exist', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    } as any)

    const { getTicketByNumber } = await import('./getByNumber.js')
    await expect(getTicketByNumber(999)).rejects.toThrow('Ticket not found')
  })
})
