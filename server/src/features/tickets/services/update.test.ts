import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../../drizzle/client.js', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
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

describe('updateTicket', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('sends completion email when status changes to COMPLETE', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { sendMail } = await import('../../../shared/services/graphMailClient.js')

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{
          id: 'ticket-uuid-1', ticketNumber: 5, subject: 'Laptop broken',
          status: 'IN_PROGRESS', requesterEmail: 'staff@mastertech.ie', completionNote: null,
        }]),
      }),
    } as any)

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as any)

    const { updateTicket } = await import('./update.js')
    await updateTicket({ id: 'ticket-uuid-1', status: 'COMPLETE', completionNote: 'Replaced the screen.' })

    expect(sendMail).toHaveBeenCalledOnce()
    const callArgs = vi.mocked(sendMail).mock.calls[0][0]
    expect(callArgs.subject).toContain('[TKT-0005]')
    expect(callArgs.subject).toContain('Resolved')
    expect(callArgs.htmlBody).toContain('Replaced the screen.')
  })

  it('does NOT send email when status changes to IN_PROGRESS', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { sendMail } = await import('../../../shared/services/graphMailClient.js')

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{
          id: 'ticket-uuid-1', ticketNumber: 1, subject: 'Test',
          status: 'NEW', requesterEmail: 'staff@mastertech.ie', completionNote: null,
        }]),
      }),
    } as any)

    vi.mocked(db.update).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    } as any)

    const { updateTicket } = await import('./update.js')
    await updateTicket({ id: 'ticket-uuid-1', status: 'IN_PROGRESS' })

    expect(sendMail).not.toHaveBeenCalled()
  })
})
