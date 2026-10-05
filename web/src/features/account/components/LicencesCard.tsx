import type { getApiMe } from '@/http/api'
import * as Icons from 'lucide-react'

type MeLicence = Awaited<ReturnType<typeof getApiMe>>['licences'][number]

const DASH = '—'
const LOAD_ERROR =
  'We could not load your account details. Refresh the page to try again. If it keeps happening, contact IT support.'
const DAY_MS = 24 * 60 * 60 * 1000

function expiryDisplay(expiryDate: string | null, today: Date) {
  if (!expiryDate) return { label: 'No expiry', className: 'text-gray-100' }

  const expiry = new Date(`${expiryDate}T00:00:00`)
  if (Number.isNaN(expiry.getTime())) {
    return { label: DASH, className: 'text-gray-100' }
  }

  const formatted = expiry.toLocaleDateString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const startOfToday = new Date(today)
  startOfToday.setHours(0, 0, 0, 0)

  if (expiry < startOfToday) {
    return { label: `${formatted} (expired)`, className: 'text-red' }
  }
  if (expiry.getTime() - startOfToday.getTime() <= 30 * DAY_MS) {
    return { label: formatted, className: 'text-orange-500' }
  }
  return { label: formatted, className: 'text-gray-100' }
}

export function LicencesCard({
  licences,
  failed,
}: {
  licences: MeLicence[]
  failed: boolean
}) {
  const today = new Date()

  return (
    <section
      aria-labelledby="licences-title"
      className="rounded border border-gray-600 bg-gray-800 p-6"
    >
      <div className="flex items-center gap-2">
        <Icons.KeyRound aria-hidden="true" className="w-4 h-4 text-gray-100" />
        <h2
          id="licences-title"
          className="font-heading text-sm font-semibold uppercase tracking-wider leading-tight text-gray-100"
        >
          Licences
        </h2>
        {!failed && (
          <span className="ml-auto font-mono text-xs text-gray-100">
            {licences.length}
          </span>
        )}
      </div>

      {failed ? (
        <p className="mt-4 text-sm text-red">{LOAD_ERROR}</p>
      ) : licences.length === 0 ? (
        <p className="mt-4 py-2 text-sm text-gray-100">
          No licences assigned to you.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {licences.map(licence => {
            const expiry = expiryDisplay(licence.expiryDate, today)
            return (
              <div
                key={licence.id}
                className="rounded border border-gray-600 bg-gray-700 px-4 py-2 min-h-12 flex flex-col gap-1 md:flex-row md:items-center md:gap-4"
              >
                <span className="font-mono text-xs text-gray-50 shrink-0">
                  {licence.licenceNumber || DASH}
                </span>
                <span
                  title={licence.name}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-50"
                >
                  {licence.name || DASH}
                </span>
                <span className="text-sm text-gray-100">
                  {licence.licenceType || DASH}
                </span>
                <span className={`font-mono text-xs ${expiry.className}`}>
                  Expires: {expiry.label}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
