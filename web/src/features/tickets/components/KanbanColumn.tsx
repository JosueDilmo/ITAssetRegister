import { TicketCard } from './TicketCard'

interface Ticket {
  id: string
  ticketNumber: number
  subject: string
  requesterEmail: string
  priority: string
  assignedAgentEmail: string | null
}

interface Props {
  title: string
  tickets: Ticket[]
  onSelect: (id: string) => void
}

export function KanbanColumn({ title, tickets, onSelect }: Props) {
  return (
    <div className="flex flex-col min-h-0 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 shrink-0">
        <span className="text-sm font-medium text-gray-200">{title}</span>
        <span className="font-mono text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
          {tickets.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {tickets.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-6">No tickets</p>
        ) : (
          tickets.map(ticket => (
            <TicketCard key={ticket.id} ticket={ticket} onClick={() => onSelect(ticket.id)} />
          ))
        )}
      </div>
    </div>
  )
}
