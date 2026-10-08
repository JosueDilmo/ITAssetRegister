import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./graphAuth.js', () => ({
  getGraphAccessToken: vi.fn().mockResolvedValue('tok'),
  clearGraphTokenCache: vi.fn(),
}))

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { clearGraphTokenCache, getGraphAccessToken } from './graphAuth.js'
import {
  GRAPH_BASE,
  GraphError,
  graphFetch,
  retryAfterMs,
} from './graphFetch.js'

const URL_OK = `${GRAPH_BASE}/drives/d/items/i1`

function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  })
}

describe('retryAfterMs', () => {
  it('parses numeric seconds to ms', () => {
    expect(retryAfterMs('2')).toBe(2000)
  })

  it('parses an HTTP-date to ms until then, floored at 0', () => {
    const now = Date.parse('2026-01-01T00:00:00Z')
    expect(retryAfterMs('Thu, 01 Jan 2026 00:00:03 GMT', now)).toBe(3000)
    expect(retryAfterMs('Wed, 31 Dec 2025 23:59:00 GMT', now)).toBe(0)
  })

  it('returns undefined for null or unparseable values', () => {
    expect(retryAfterMs(null)).toBeUndefined()
    expect(retryAfterMs('soon')).toBeUndefined()
  })
})

describe('graphFetch', () => {
  const sleep = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    mockFetch.mockReset()
    sleep.mockClear()
    vi.mocked(clearGraphTokenCache).mockClear()
    vi.mocked(getGraphAccessToken).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('returns a 200 response and sends the bearer token', async () => {
    mockFetch.mockResolvedValueOnce(json({ ok: true }))
    const res = await graphFetch(URL_OK, {}, { sleep })
    expect(res.status).toBe(200)
    const [, init] = mockFetch.mock.calls[0]
    expect(new Headers(init.headers).get('authorization')).toBe('Bearer tok')
  })

  it('retries a 429 honouring numeric Retry-After', async () => {
    mockFetch
      .mockResolvedValueOnce(
        new Response('', { status: 429, headers: { 'retry-after': '2' } })
      )
      .mockResolvedValueOnce(json({ ok: true }))
    const res = await graphFetch(URL_OK, {}, { sleep })
    expect(res.status).toBe(200)
    expect(sleep).toHaveBeenCalledTimes(1)
    expect(sleep).toHaveBeenCalledWith(2000)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('retries a 503 honouring an HTTP-date Retry-After', async () => {
    vi.useFakeTimers()
    const now = new Date('2026-01-01T00:00:00Z')
    vi.setSystemTime(now)
    mockFetch
      .mockResolvedValueOnce(
        new Response('', {
          status: 503,
          headers: {
            'retry-after': new Date(now.getTime() + 3000).toUTCString(),
          },
        })
      )
      .mockResolvedValueOnce(json({ ok: true }))
    await graphFetch(URL_OK, {}, { sleep })
    expect(sleep).toHaveBeenCalledTimes(1)
    const waited = sleep.mock.calls[0][0] as number
    expect(waited).toBeGreaterThan(2000)
    expect(waited).toBeLessThanOrEqual(3000)
  })

  it('uses exponential backoff with jitter for a 504 without Retry-After', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('', { status: 504 }))
      .mockResolvedValueOnce(json({ ok: true }))
    await graphFetch(URL_OK, {}, { sleep })
    const waited = sleep.mock.calls[0][0] as number
    expect(waited).toBeGreaterThanOrEqual(500)
    expect(waited).toBeLessThanOrEqual(750)
  })

  it.each(['POST', 'PUT', 'PATCH'])(
    'does not replay a %s after a 503/504 (outcome unknown)',
    async method => {
      for (const status of [503, 504]) {
        mockFetch.mockReset()
        sleep.mockClear()
        mockFetch.mockResolvedValueOnce(new Response('', { status }))
        const err = await graphFetch(URL_OK, { method }, { sleep }).catch(
          e => e
        )
        expect(err).toBeInstanceOf(GraphError)
        expect(err.status).toBe(status)
        expect(err.retryable).toBe(false)
        expect(mockFetch).toHaveBeenCalledTimes(1)
        expect(sleep).not.toHaveBeenCalled()
      }
    }
  )

  it('still replays a POST after a 429 (rejected before processing)', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(json({ ok: true }))
    const res = await graphFetch(URL_OK, { method: 'POST' }, { sleep })
    expect(res.status).toBe(200)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('replays a DELETE after a 503', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(json({ ok: true }))
    await graphFetch(URL_OK, { method: 'DELETE' }, { sleep })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('replays a POST after a 503 only with retryUnsafe', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('', { status: 503 }))
      .mockResolvedValueOnce(json({ ok: true }))
    await graphFetch(URL_OK, { method: 'POST' }, { sleep, retryUnsafe: true })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws a retryable GraphError after maxRetries throttled attempts', async () => {
    mockFetch.mockImplementation(async () => new Response('', { status: 429 }))
    const err = await graphFetch(URL_OK, {}, { sleep, maxRetries: 3 }).catch(
      e => e
    )
    expect(err).toBeInstanceOf(GraphError)
    expect(err.status).toBe(429)
    expect(err.retryable).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('fails fast when Retry-After exceeds maxWaitMs', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('', { status: 429, headers: { 'retry-after': '120' } })
    )
    const err = await graphFetch(URL_OK, {}, { sleep }).catch(e => e)
    expect(err).toBeInstanceOf(GraphError)
    expect(err.retryable).toBe(true)
    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it('clears the token cache and retries once on a 401', async () => {
    mockFetch
      .mockResolvedValueOnce(new Response('', { status: 401 }))
      .mockResolvedValueOnce(json({ ok: true }))
    const res = await graphFetch(URL_OK, {}, { sleep })
    expect(res.status).toBe(200)
    expect(clearGraphTokenCache).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('throws GraphError 401 on a second 401', async () => {
    mockFetch.mockImplementation(async () => new Response('', { status: 401 }))
    const err = await graphFetch(URL_OK, {}, { sleep }).catch(e => e)
    expect(err).toBeInstanceOf(GraphError)
    expect(err.status).toBe(401)
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('maps a Graph error body and request-id header without leaking the token', async () => {
    mockFetch.mockResolvedValueOnce(
      json(
        { error: { code: 'itemNotFound', message: 'secret tok detail' } },
        404,
        {
          'request-id': 'req-1',
        }
      )
    )
    const err = await graphFetch(URL_OK, {}, { sleep }).catch(e => e)
    expect(err).toBeInstanceOf(GraphError)
    expect(err.status).toBe(404)
    expect(err.code).toBe('itemNotFound')
    expect(err.requestId).toBe('req-1')
    expect(err.retryable).toBe(false)
    expect(err.message).not.toContain('tok')
  })

  it('falls back to code unknown for a non-JSON error body', async () => {
    mockFetch.mockResolvedValueOnce(new Response('<html>', { status: 500 }))
    const err = await graphFetch(URL_OK, {}, { sleep }).catch(e => e)
    expect(err.code).toBe('unknown')
    expect(err.status).toBe(500)
  })

  it('refuses a non-Graph URL before a token is requested', async () => {
    await expect(
      graphFetch('https://evil.example/x', {}, { sleep })
    ).rejects.toThrow('refusing non-Graph URL')
    expect(getGraphAccessToken).not.toHaveBeenCalled()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('refuses a lookalike origin', async () => {
    await expect(
      graphFetch('https://graph.microsoft.com.evil.example/x', {}, { sleep })
    ).rejects.toThrow('refusing non-Graph URL')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('returns a 302 unchanged when redirect is manual', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: 'https://x.sharepoint.com/a.pdf' },
      })
    )
    const res = await graphFetch(URL_OK, { redirect: 'manual' }, { sleep })
    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('https://x.sharepoint.com/a.pdf')
  })
})
