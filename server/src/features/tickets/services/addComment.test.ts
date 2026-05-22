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

describe('addComment', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('inserts comment and sends notification email to requester', async () => {
    const { db } = await import('../../../drizzle/client.js')
    const { sendMail } = await import('../../../shared/services/graphMailClient.js')

    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{
          id: 'ticket-uuid-1', ticketNumber: 3, subject: 'VPN issue',
          requesterEmail: 'staff@mastertech.ie',
        }]),
      }),
    } as any)

    vi.mocked(db.insert).mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 'comment-uuid-1', ticketId: 'ticket-uuid-1',
          authorEmail: 'agent@mastertech.ie', body: 'Try restarting the VPN client.',
          source: 'agent', createdAt: new Date(),
        }]),
      }),
    } as any)

    const { addComment } = await import('./addComment.js')
    const result = await addComment({
      ticketId: 'ticket-uuid-1',
      authorEmail: 'agent@mastertech.ie',
      body: 'Try restarting the VPN client.',
    })

    expect(result.id).toBe('comment-uuid-1')
    expect(sendMail).toHaveBeenCalledOnce()
    const callArgs = vi.mocked(sendMail).mock.calls[0][0]
    expect(callArgs.to).toBe('staff@mastertech.ie')
    expect(callArgs.subject).toContain('[TKT-0003]')
    expect(callArgs.htmlBody).toContain('Try restarting the VPN client.')
  })
})
