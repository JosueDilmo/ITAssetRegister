'use client'

import { useEffect } from 'react'

export default function ManagerError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Manager error:', error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-lg border border-red-800 bg-red-900/20 p-6 text-center">
        <h2 className="mb-2 text-xl font-bold text-red-400">
          Something went wrong
        </h2>
        <p className="mb-4 text-sm text-zinc-400">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:bg-zinc-600"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
