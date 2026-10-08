import { env } from '../../env.js'

let cachedToken: string | null = null
let tokenExpiresAt = 0

/**
 * Builds the failure message from the AAD error code, error_codes and trace_id
 * only. The raw body carries error_description (AADSTS text, correlation id,
 * sometimes client/tenant identifiers) and must never reach logs or reports.
 */
async function describeTokenFailure(res: Response): Promise<string> {
  const parts = [`Graph token fetch failed: ${res.status}`]
  try {
    const body = JSON.parse(await res.text()) as {
      error?: unknown
      error_codes?: unknown
      trace_id?: unknown
    }
    if (typeof body.error === 'string' && /^[\w.-]{1,64}$/.test(body.error))
      parts.push(body.error)
    if (
      Array.isArray(body.error_codes) &&
      body.error_codes.every(c => Number.isInteger(c))
    )
      parts.push(`codes=${body.error_codes.slice(0, 5).join(',')}`)
    if (
      typeof body.trace_id === 'string' &&
      /^[\w-]{1,64}$/.test(body.trace_id)
    )
      parts.push(`trace_id=${body.trace_id}`)
  } catch {
    // Non-JSON body: status only.
  }
  return parts.join(' ')
}

export async function getGraphAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: env.GRAPH_CLIENT_ID,
    client_secret: env.GRAPH_CLIENT_SECRET,
    scope: 'https://graph.microsoft.com/.default',
  })

  const res = await fetch(
    `https://login.microsoftonline.com/${env.GRAPH_TENANT_ID}/oauth2/v2.0/token`,
    { method: 'POST', body: params }
  )

  if (!res.ok) {
    throw new Error(await describeTokenFailure(res))
  }

  const data = (await res.json()) as {
    access_token: string
    expires_in: number
  }
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000
  return cachedToken
}

export function clearGraphTokenCache(): void {
  cachedToken = null
  tokenExpiresAt = 0
}
