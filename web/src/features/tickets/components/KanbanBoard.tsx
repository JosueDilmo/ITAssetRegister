'use client'
import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getApiTickets } from '@/http/api'
import { Button } from '@/shared/components/button'
import { KanbanColumn } from './KanbanColumn'
import { TicketSlideOver } from './TicketSlideOver'

interface Ticket {
  id: string
  ticketNumber: number
  subject: string
  description: string
  priority: string
  status: string
  requesterEmail: string
  assignedAgentEmail: string | null
  completionNote: string | null
  createdAt: string
  updatedAt: string
}

const COLUMNS: { key: string; label: string }[] = [
  { key: 'NEW', label: 'New' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETE', label: 'Complete' },
]

export function KanbanBoard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getApiTickets() as unknown as { tickets: Ticket[] }
      setTickets(data.tickets)
    } catch {
      setError('Failed to load tickets.')
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
        <h1 className="text-lg font-medium text-gray-100">Support Tickets</h1>
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
        <div className="grid grid-cols-3 gap-4 flex-1">
          {COLUMNS.map(col => (
            <div
              key={col.key}
              className="bg-gray-900 border border-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4 flex-1 min-h-0">
          {COLUMNS.map(col => (
            <KanbanColumn
              key={col.key}
              title={col.label}
              tickets={tickets.filter(t => t.status === col.key)}
              onSelect={setSelectedTicketId}
            />
          ))}
        </div>
      )}

      {selectedTicketId && (
        <TicketSlideOver
          ticketId={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={fetchTickets}
        />
      )}
    </div>
  )
}
