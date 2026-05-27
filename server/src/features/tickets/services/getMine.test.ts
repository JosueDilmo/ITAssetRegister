import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({
  db: { select: vi.fn() },
}))

const baseTicket = {
  id: 'ticket-uuid-1',
  ticketNumber: 5,
  subject: 'Keyboard broken',
  description: 'Keys stopped working.',
  priority: 'MEDIUM',
  status: 'NEW',
  requesterEmail: 'staff@mastertech.ie',
  requesterStaffId: null,
  assignedAgentEmail: null,
  completionNote: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('getMyTickets', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns tickets belonging to the requester', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([baseTicket]),
        }),
      }),
    } as any)

    const { getMyTickets } = await import('./getMine.js')
    const result = await getMyTickets('staff@mastertech.ie')

    expect(result).toHaveLength(1)
    expect(result[0].requesterEmail).toBe('staff@mastertech.ie')
  })

  it('returns empty array when requester has no tickets', async () => {
    const { db } = await import('../../../drizzle/client.js')

    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockResolvedValue([]),
        }),
      }),
    } as any)

    const { getMyTickets } = await import('./getMine.js')
    const result = await getMyTickets('nobody@mastertech.ie')

    expect(result).toHaveLength(0)
  })
})
