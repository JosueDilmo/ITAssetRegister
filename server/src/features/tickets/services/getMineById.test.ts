import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./getById.js', () => ({
  getTicketById: vi.fn(),
}))

vi.mock('../../../errors/index.js', () => ({
  NotFoundError: class NotFoundError extends Error {
    constructor(msg: string) { super(msg); this.name = 'NotFoundError' }
  },
  ERROR_MESSAGES: { TICKET_NOT_FOUND: 'Ticket not found' },
}))

const fullTicket = {
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
  comments: [],
  attachments: [],
}

describe('getMyTicketById', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('returns ticket when id matches and requester owns it', async () => {
    const { getTicketById } = await import('./getById.js')
    vi.mocked(getTicketById).mockResolvedValueOnce(fullTicket)

    const { getMyTicketById } = await import('./getMineById.js')
    const result = await getMyTicketById('ticket-uuid-1', 'staff@mastertech.ie')

    expect(result.id).toBe('ticket-uuid-1')
  })

  it('throws NotFoundError when requester does not own the ticket', async () => {
    const { getTicketById } = await import('./getById.js')
    vi.mocked(getTicketById).mockResolvedValueOnce(fullTicket)

    const { getMyTicketById } = await import('./getMineById.js')
    await expect(
      getMyTicketById('ticket-uuid-1', 'other@mastertech.ie')
    ).rejects.toThrow('Ticket not found')
  })

  it('propagates NotFoundError when ticket does not exist', async () => {
    const { getTicketById } = await import('./getById.js')
    vi.mocked(getTicketById).mockRejectedValueOnce(new Error('Ticket not found'))

    const { getMyTicketById } = await import('./getMineById.js')
    await expect(
      getMyTicketById('missing-uuid', 'staff@mastertech.ie')
    ).rejects.toThrow('Ticket not found')
  })
})
