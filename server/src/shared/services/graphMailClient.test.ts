import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('../../env.js', () => ({
  env: {
    GRAPH_TENANT_ID: 'tenant-id',
    GRAPH_CLIENT_ID: 'client-id',
    GRAPH_CLIENT_SECRET: 'client-secret',
    SUPPORT_EMAIL: 'it.support@mastertech.ie',
  },
}))

describe('graphMailClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('fetches a token then calls sendMail', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-abc', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: true })

    const { sendMail } = await import('./graphMailClient.js')
    await sendMail({ to: 'user@example.com', subject: 'Hello', htmlBody: '<p>Hi</p>' })

    expect(mockFetch).toHaveBeenCalledTimes(2)
    const [sendMailUrl, sendMailOptions] = mockFetch.mock.calls[1]
    expect(sendMailUrl).toContain('/sendMail')
    const body = JSON.parse(sendMailOptions.body)
    expect(body.message.subject).toBe('Hello')
    expect(body.message.toRecipients[0].emailAddress.address).toBe('user@example.com')
  })

  it('skips sending when to === SUPPORT_EMAIL', async () => {
    const { sendMail } = await import('./graphMailClient.js')
    await sendMail({
      to: 'it.support@mastertech.ie',
      subject: 'Loop test',
      htmlBody: '<p>loop</p>',
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws when Graph sendMail returns non-ok', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-abc', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'Forbidden' })

    const { sendMail } = await import('./graphMailClient.js')
    await expect(
      sendMail({ to: 'user@example.com', subject: 'Fail', htmlBody: '<p>fail</p>' })
    ).rejects.toThrow('Graph sendMail failed: 403')
  })
})
