// ── ORVAL-COMPAT (uncomment + comment out production block below to regen api.ts) ──
// export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
//   const response = await fetch(url, { ...options, credentials: 'include' })
//   const text = await response.text()
//   return (text ? JSON.parse(text) : undefined) as T
// }
// ── END ORVAL-COMPAT ──────────────────────────────────────────────────────────────

export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
  let cookieHeader: string | undefined
  const isServer = typeof window === 'undefined'

  if (!isServer && process.env.NEXT_PUBLIC_API_URL) {
    url = url.replace(/^https?:\/\/[^/]+/, process.env.NEXT_PUBLIC_API_URL)
  }

  if (isServer) {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const all = cookieStore.getAll()
      if (all.length > 0) {
        cookieHeader = all.map(c => `${c.name}=${c.value}`).join('; ')
      }
    } catch {}
  }

  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options.headers,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw error
  }

  const text = await response.text()
  return (text ? JSON.parse(text) : undefined) as T
}
