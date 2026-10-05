import type { getApiTicketsMine } from '@/http/api'
import * as Icons from 'lucide-react'
import Link from 'next/link'

type MyTicket = Awaited<ReturnType<typeof getApiTicketsMine>>['tickets'][number]

const LOAD_ERROR =
  'We could not load your tickets. Refresh the page to try again, or open Support to see them there.'

function statusBadge(status: string) {
  if (status === 'NEW') return 'border-blue text-blue'
  if (status === 'IN_PROGRESS') return 'border-orange-500 text-orange-500'
  return 'border-gray-300 text-gray-100'
}

function formatUpdated(updatedAt: string) {
  return new Date(updatedAt).toLocaleString('en-IE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OpenTicketsCard({
  tickets,
  failed,
}: {
  tickets: MyTicket[]
  failed: boolean
}) {
  return (
    <section
      aria-labelledby="tickets-title"
      className="rounded border border-gray-600 bg-gray-800 p-6"
    >
      <div className="flex items-center gap-2">
        <Icons.Ticket aria-hidden="true" className="w-4 h-4 text-gray-100" />
        <h2
          id="tickets-title"
          className="font-heading text-sm font-semibold uppercase tracking-wider leading-tight text-gray-100"
        >
          Open tickets
        </h2>
        {!failed && (
          <span className="font-mono text-xs text-gray-100">
            {tickets.length}
          </span>
        )}
        <Link
          href="/support"
          className="ml-auto inline-flex items-center gap-1 font-mono text-xs text-blue hover:underline focus-visible:outline-2 focus-visible:outline-blue"
        >
          View all tickets
          <Icons.ArrowRight aria-hidden="true" className="w-4 h-4" />
        </Link>
      </div>

      {failed ? (
        <p className="mt-4 text-sm text-red">{LOAD_ERROR}</p>
      ) : tickets.length === 0 ? (
        <p className="mt-4 py-2 text-sm text-gray-100">
          You have no open tickets.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-2">
          {tickets.map(ticket => (
            <Link
              key={ticket.id}
              href="/support"
              className="rounded border border-gray-600 bg-gray-700 px-4 py-2 min-h-12 flex flex-col gap-1 md:flex-row md:items-center md:gap-4 hover:border-blue hover:bg-gray-600 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-blue"
            >
              <span className="font-mono text-xs text-gray-100 w-20 shrink-0">
                TKT-{String(ticket.ticketNumber).padStart(4, '0')}
              </span>
              <span
                title={ticket.subject}
                className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-50"
              >
                {ticket.subject}
              </span>
              <span
                className={`font-mono text-xs uppercase border px-2 py-1 rounded shrink-0 ${statusBadge(ticket.status)}`}
              >
                {ticket.status.replace('_', ' ')}
              </span>
              <span className="font-mono text-xs text-gray-100 shrink-0">
                {formatUpdated(ticket.updatedAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
