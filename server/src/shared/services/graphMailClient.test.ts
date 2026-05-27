import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('./graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok-abc'),
}))

vi.mock('../../env.js', () => ({
  env: {
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

  it('calls sendMail with correct payload', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    const { sendMail } = await import('./graphMailClient.js')
    await sendMail({ to: 'user@example.com', subject: 'Hello', htmlBody: '<p>Hi</p>' })

    expect(mockFetch).toHaveBeenCalledOnce()
    const [sendMailUrl, sendMailOptions] = mockFetch.mock.calls[0]
    expect(sendMailUrl).toContain('/sendMail')
    const body = JSON.parse(sendMailOptions.body)
    expect(body.message.subject).toBe('Hello')
    expect(body.message.toRecipients[0].emailAddress.address).toBe('user@example.com')
  })

  it('skips sending when to === SUPPORT_EMAIL', async () => {
    const { sendMail } = await import('./graphMailClient.js')
    await sendMail({ to: 'it.support@mastertech.ie', subject: 'Loop test', htmlBody: '<p>loop</p>' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('throws when Graph sendMail returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 403, text: async () => 'Forbidden' })

    const { sendMail } = await import('./graphMailClient.js')
    await expect(
      sendMail({ to: 'user@example.com', subject: 'Fail', htmlBody: '<p>fail</p>' })
    ).rejects.toThrow('Graph sendMail failed: 403')
  })
})
