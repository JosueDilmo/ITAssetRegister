import { env } from '../../env.js'

interface SendMailOptions {
  to: string
  subject: string
  htmlBody: string
}

let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getAccessToken(): Promise<string> {
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

  if (!res.ok) throw new Error(`Graph token fetch failed: ${res.status}`)

  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = data.access_token
  tokenExpiresAt = Date.now() + data.expires_in * 1000
  return cachedToken
}

export async function sendMail({ to, subject, htmlBody }: SendMailOptions): Promise<void> {
  if (to === env.SUPPORT_EMAIL) return

  const token = await getAccessToken()

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/users/${env.SUPPORT_EMAIL}/sendMail`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: to } }],
        },
      }),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Graph sendMail failed: ${res.status} ${text}`)
  }
}
