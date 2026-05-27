const priorityClasses: Record<string, string> = {
  HIGH: 'border-red-500 text-red-400',
  MEDIUM: 'border-amber-500 text-amber-400',
  LOW: 'border-green-500 text-green-400',
}

interface Ticket {
  id: string
  ticketNumber: number
  subject: string
  requesterEmail: string
  priority: string
  assignedAgentEmail: string | null
}

interface Props {
  ticket: Ticket
  onClick: () => void
}

export function TicketCard({ ticket, onClick }: Props) {
  const label = `TKT-${String(ticket.ticketNumber).padStart(4, '0')}`

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 rounded border border-gray-600 bg-gray-800 hover:border-blue-500 hover:bg-gray-700 transition-all duration-150 space-y-1.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-gray-400">{label}</span>
        <span
          className={`text-xs font-mono border px-1.5 py-0.5 rounded ${
            priorityClasses[ticket.priority] ?? 'border-gray-500 text-gray-400'
          }`}
        >
          {ticket.priority}
        </span>
      </div>
      <p className="text-sm text-gray-100 font-medium truncate">{ticket.subject}</p>
      <p className="text-xs text-gray-400 truncate">{ticket.requesterEmail}</p>
      <p className="text-xs text-gray-500 truncate">
        {ticket.assignedAgentEmail ?? 'Unassigned'}
      </p>
    </button>
  )
}
