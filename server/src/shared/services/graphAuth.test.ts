import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

vi.mock('../../env.js', () => ({
  env: {
    GRAPH_TENANT_ID: 'tenant-id',
    GRAPH_CLIENT_ID: 'client-id',
    GRAPH_CLIENT_SECRET: 'client-secret',
  },
}))

describe('getGraphAccessToken', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('fetches a token on first call', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'tok-abc', expires_in: 3600 }),
    })

    const { getGraphAccessToken } = await import('./graphAuth.js')
    const token = await getGraphAccessToken()

    expect(token).toBe('tok-abc')
    expect(mockFetch).toHaveBeenCalledOnce()
    const [url] = mockFetch.mock.calls[0]
    expect(url).toContain('login.microsoftonline.com/tenant-id')
  })

  it('returns cached token on second call without re-fetching', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'tok-abc', expires_in: 3600 }),
    })

    const { getGraphAccessToken } = await import('./graphAuth.js')
    await getGraphAccessToken()
    const token = await getGraphAccessToken()

    expect(token).toBe('tok-abc')
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it('re-fetches when token is expired', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-old', expires_in: 0 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tok-new', expires_in: 3600 }),
      })

    const { getGraphAccessToken } = await import('./graphAuth.js')
    await getGraphAccessToken()
    const token = await getGraphAccessToken()

    expect(token).toBe('tok-new')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws when token endpoint returns non-ok', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'Unauthorized' })

    const { getGraphAccessToken } = await import('./graphAuth.js')
    await expect(getGraphAccessToken()).rejects.toThrow('Graph token fetch failed: 401')
  })
})
