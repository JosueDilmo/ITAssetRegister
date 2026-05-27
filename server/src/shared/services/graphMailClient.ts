import { env } from '../../env.js'
import { getGraphAccessToken } from './graphAuth.js'

interface SendMailOptions {
  to: string
  subject: string
  htmlBody: string
}

export async function sendMail({ to, subject, htmlBody }: SendMailOptions): Promise<void> {
  if (to === env.SUPPORT_EMAIL) return

  const token = await getGraphAccessToken()

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
