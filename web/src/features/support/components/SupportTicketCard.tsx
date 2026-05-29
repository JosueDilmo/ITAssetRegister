const statusClasses: Record<string, string> = {
  NEW: 'border-blue-500 text-blue-400',
  IN_PROGRESS: 'border-amber-500 text-amber-400',
  COMPLETE: 'border-green-500 text-green-400',
}

const priorityClasses: Record<string, string> = {
  HIGH: 'border-red-500 text-red-400',
  MEDIUM: 'border-amber-500 text-amber-400',
  LOW: 'border-green-500 text-green-400',
}

interface Ticket {
  id: string
  ticketNumber: number
  subject: string
  priority: string
  status: string
  createdAt: string
}

interface Props {
  ticket: Ticket
  onClick: () => void
}

export function SupportTicketCard({ ticket, onClick }: Props) {
  const label = `TKT-${String(ticket.ticketNumber).padStart(4, '0')}`

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left p-3 rounded border border-gray-500 bg-gray-600 hover:border-blue hover:bg-gray-500 transition-all duration-150 flex items-center gap-4"
    >
      <span className="font-mono text-xs text-gray-100/60 shrink-0 w-20">{label}</span>
      <p className="flex-1 text-sm text-gray-100 font-medium truncate">{ticket.subject}</p>
      <span
        className={`text-xs font-mono border px-1.5 py-0.5 rounded shrink-0 ${
          statusClasses[ticket.status] ?? 'border-gray-500 text-gray-400'
        }`}
      >
        {ticket.status.replace('_', ' ')}
      </span>
      <span
        className={`text-xs font-mono border px-1.5 py-0.5 rounded shrink-0 ${
          priorityClasses[ticket.priority] ?? 'border-gray-500 text-gray-400'
        }`}
      >
        {ticket.priority}
      </span>
      <span className="text-xs text-gray-500 shrink-0">
        {new Date(ticket.createdAt).toLocaleDateString()}
      </span>
    </button>
  )
}
