export async function customFetch<T>(url: string, options: RequestInit): Promise<T> {
  let cookieHeader: string | undefined

  if (typeof window === 'undefined') {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      const all = cookieStore.getAll()
      if (all.length > 0) {
        cookieHeader = all.map(c => `${c.name}=${c.value}`).join('; ')
      }
    } catch {
      // not in a Next.js server context
    }
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
