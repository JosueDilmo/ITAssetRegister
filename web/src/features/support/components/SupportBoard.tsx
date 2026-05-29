'use client'
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getApiTicketsMine } from '@/http/api'
import { Button } from '@/shared/components/button'
import { SupportTicketCard } from './SupportTicketCard'
import { SupportSlideOver } from './SupportSlideOver'

interface Ticket {
  id: string
  ticketNumber: number
  subject: string
  priority: string
  status: string
  requesterEmail: string
  createdAt: string
}

export function SupportBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getApiTicketsMine() as unknown as { tickets: Ticket[] }
      setTickets(data.tickets)
    } catch {
      setError('Failed to load your tickets.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h1 className="text-lg font-medium text-gray-100">My Support Tickets</h1>
        <Button
          type="button"
          onClick={fetchTickets}
          className="flex items-center gap-1.5 h-10 w-auto px-4 text-sm"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </Button>
      </div>

      {error && <p className="text-sm text-red-400 mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded border border-gray-500 bg-gray-600 animate-pulse" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-gray-500">No tickets yet. Submit one by emailing it.support@mastertech.ie</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2">
          {tickets.map(ticket => (
            <SupportTicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicketId(ticket.id)}
            />
          ))}
        </div>
      )}

      {selectedTicketId && (
        <SupportSlideOver
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </div>
  )
}
