'use client'
import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getApiTicketsMineId } from '@/http/api'

interface Attachment {
  id: string
  filename: string
  sharePointUrl: string
  mimeType: string
  createdAt: string | Date
}

interface Comment {
  id: string
  authorEmail: string
  body: string
  source: string
  createdAt: string | Date
}

interface TicketDetail {
  id: string
  ticketNumber: number
  subject: string
  description: string
  priority: string
  status: string
  requesterEmail: string
  assignedAgentEmail: string | null
  completionNote: string | null
  createdAt: string | Date
  comments: Comment[]
  attachments: Attachment[]
}

interface Props {
  ticketId: string
  onClose: () => void
}

export function SupportSlideOver({ ticketId, onClose }: Props) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTicket = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getApiTicketsMineId(ticketId) as unknown as TicketDetail
      setTicket(data)
    } catch {
      setError('Failed to load ticket.')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  const label = ticket ? `TKT-${String(ticket.ticketNumber).padStart(4, '0')}` : '…'

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed right-0 top-0 h-full w-[480px] bg-gray-600 border-l border-gray-400 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-500 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-mono text-sm text-gray-100 shrink-0">{label}</span>
            {ticket && (
              <span className="text-sm text-gray-100 font-medium truncate">{ticket.subject}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-500 rounded transition-colors duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <p className="text-sm text-gray-100">Loading…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {ticket && (
            <>
              {/* Status + priority */}
              <section className="grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <p className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Status</p>
                  <p className="text-gray-50 font-medium">{ticket.status.replace('_', ' ')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Priority</p>
                  <p className="text-gray-50 font-medium">{ticket.priority}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Assigned Agent</p>
                  <p className="text-gray-100">{ticket.assignedAgentEmail ?? 'Unassigned'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Opened</p>
                  <p className="text-gray-100">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                </div>
              </section>

              {/* Description */}
              <section className="space-y-2 border-t border-gray-500 pt-4">
                <h3 className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">
                  Description
                </h3>
                <p className="text-sm text-gray-50 whitespace-pre-wrap">{ticket.description}</p>
              </section>

              {/* Completion note */}
              {ticket.status === 'COMPLETE' && ticket.completionNote && (
                <section className="space-y-2 border border-green-800 rounded p-3 bg-green-950/30">
                  <h3 className="text-xs font-medium text-green-400 uppercase tracking-wider">
                    Resolution
                  </h3>
                  <p className="text-sm text-gray-50 whitespace-pre-wrap">{ticket.completionNote}</p>
                </section>
              )}

              {/* Attachments */}
              {ticket.attachments.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">
                    Attachments
                  </h3>
                  <ul className="space-y-1">
                    {ticket.attachments.map(att => (
                      <li key={att.id}>
                        <a
                          href={att.sharePointUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue hover:opacity-80 transition-opacity"
                        >
                          {att.filename}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Comments */}
              <section className="space-y-3">
                <h3 className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">
                  Updates
                </h3>
                {ticket.comments.length === 0 ? (
                  <p className="text-xs text-gray-100/50">No updates yet</p>
                ) : (
                  <ul className="space-y-3">
                    {ticket.comments.map(comment => (
                      <li key={comment.id} className="border border-gray-500 rounded p-3 space-y-1">
                        <div className="flex justify-between text-xs text-gray-100">
                          <span>{comment.source === 'email' ? 'You (email reply)' : comment.authorEmail}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-50 whitespace-pre-wrap">{comment.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </>
  )
}
