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

vi.mock('../../../env.js', () => ({
  env: {
    SUPPORT_EMAIL: 'it.support@mastertech.ie',
    APP_BASE_URL: 'https://app.example.com',
  },
}))

describe('ingestTicket', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('inserts a ticket and calls sendMail with TKT-formatted subject', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { sendMail } = await import('../../../shared/services/graphMailClient.js')

    const mockTicket = {
      id: 'ticket-uuid-1',
      ticketNumber: 1,
      subject: 'My laptop is broken',
    }

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
})
