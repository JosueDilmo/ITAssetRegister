import { clearGraphTokenCache, getGraphAccessToken } from './graphAuth.js'

export const GRAPH_ORIGIN = 'https://graph.microsoft.com'
export const GRAPH_BASE = `${GRAPH_ORIGIN}/v1.0`

const THROTTLE_STATUSES = new Set([429, 503, 504])

/**
 * Error raised for any failed Graph call. Holds status, Graph error code and
 * request-id only: never the bearer token and never the raw response body.
 */
export class GraphError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId: string | null
  readonly retryable: boolean

  constructor(
    status: number,
    code: string,
    requestId: string | null = null,
    retryable = false
  ) {
    super(`Graph ${status} ${code}`)
    this.name = 'GraphError'
    this.status = status
    this.code = code
    this.requestId = requestId
    this.retryable = retryable
  }
}

export interface GraphFetchOptions {
  maxRetries?: number
  maxWaitMs?: number
  sleep?: (ms: number) => Promise<void>
}

/** Parses a Retry-After header (seconds or HTTP-date) into milliseconds. */
export function retryAfterMs(
  header: string | null,
  now = Date.now()
): number | undefined {
  if (header === null) return undefined
  const value = header.trim()
  if (value === '') return undefined
  if (/^\d+(\.\d+)?$/.test(value)) return Math.round(Number(value) * 1000)
  const at = Date.parse(value)
  if (Number.isNaN(at)) return undefined
  return Math.max(0, at - now)
}

const defaultSleep = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms))

async function toGraphError(
  res: Response,
  retryable: boolean
): Promise<GraphError> {
  let code = 'unknown'
  let requestId = res.headers.get('request-id')
  try {
    const body = (await res.json()) as {
      error?: { code?: unknown; innerError?: Record<string, unknown> }
    }
    if (typeof body?.error?.code === 'string' && body.error.code !== '')
      code = body.error.code
    const inner = body?.error?.innerError?.['request-id']
    if (!requestId && typeof inner === 'string') requestId = inner
  } catch {
    // Non-JSON body: keep the fallback code.
  }
  return new GraphError(res.status, code, requestId, retryable)
}

/**
 * Single transport for every Microsoft Graph call (app-only token).
 * - Refuses any URL outside https://graph.microsoft.com/ before a token is requested,
 *   so a foreign @odata.nextLink never receives the bearer.
 * - Retries 429/503/504 up to maxRetries, honouring Retry-After, else exponential
 *   backoff with jitter; a required wait above maxWaitMs fails fast (retryable).
 * - A 401 clears the cached token and retries once with a fresh one.
 */
export async function graphFetch(
  url: string,
  init: RequestInit = {},
  opts: GraphFetchOptions = {}
): Promise<Response> {
  if (!url.startsWith(`${GRAPH_ORIGIN}/`)) {
    throw new Error('graphFetch: refusing non-Graph URL')
  }

  const maxRetries = opts.maxRetries ?? 3
  const maxWaitMs = opts.maxWaitMs ?? 15_000
  const sleep = opts.sleep ?? defaultSleep

  let attempt = 0
  let refreshed = false

  while (true) {
    const headers = new Headers(init.headers)
    headers.set('Authorization', `Bearer ${await getGraphAccessToken()}`)
    const res = await fetch(url, { ...init, headers })

    if (res.ok) return res
    if (init.redirect === 'manual' && res.status >= 300 && res.status <= 399)
      return res

    if (res.status === 401) {
      if (refreshed) throw await toGraphError(res, false)
      refreshed = true
      clearGraphTokenCache()
      continue
    }

    if (THROTTLE_STATUSES.has(res.status)) {
      if (attempt >= maxRetries) throw await toGraphError(res, true)
      const wait =
        retryAfterMs(res.headers.get('retry-after')) ??
        Math.min(500 * 2 ** attempt, 8000) + Math.random() * 250
      if (wait > maxWaitMs) throw await toGraphError(res, true)
      await sleep(wait)
      attempt++
      continue
    }

    throw await toGraphError(res, false)
  }
}
