'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { getApiTicketsId, patchApiTicketsId } from '@/http/api'
import { Button } from '@/shared/components/button'
import { AddCommentForm } from './AddCommentForm'

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
  onTicketUpdated: () => void
}

export function TicketSlideOver({ ticketId, onClose, onTicketUpdated }: Props) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [assignedAgent, setAssignedAgent] = useState('')
  const [completionNote, setCompletionNote] = useState('')

  const fetchTicket = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getApiTicketsId(ticketId) as unknown as TicketDetail
      setTicket(data)
      setStatus(data.status)
      setPriority(data.priority)
      setAssignedAgent(data.assignedAgentEmail ?? '')
      setCompletionNote(data.completionNote ?? '')
    } catch {
      setError('Failed to load ticket.')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchTicket()
  }, [fetchTicket])

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await patchApiTicketsId(ticketId, {
        status: status as 'NEW' | 'IN_PROGRESS' | 'COMPLETE',
        priority: priority as 'HIGH' | 'MEDIUM' | 'LOW',
        assignedAgentEmail: assignedAgent || null,
        completionNote: completionNote || null,
      })
      onTicketUpdated()
      await fetchTicket()
    } catch {
      setSaveError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
          <div className="flex items-center gap-3 shrink-0">
            {ticket && (
              <Link
                href={`/tickets/${ticket.id}`}
                className="text-xs font-medium text-blue hover:opacity-80 transition-opacity"
              >
                Open →
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-100 hover:bg-gray-500 rounded transition-colors duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {loading && <p className="text-sm text-gray-400">Loading…</p>}
          {error && <p className="text-sm text-red-400">{error}</p>}

          {ticket && (
            <>
              {/* Edit form */}
              <section className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Status</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-gray-500 border border-gray-300 rounded text-gray-50 focus:outline-none focus:border-blue"
                    >
                      <option value="NEW">New</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETE">Complete</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Priority</label>
                    <select
                      value={priority}
                      onChange={e => setPriority(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm bg-gray-500 border border-gray-300 rounded text-gray-50 focus:outline-none focus:border-blue"
                    >
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Assigned Agent</label>
                  <input
                    type="email"
                    value={assignedAgent}
                    onChange={e => setAssignedAgent(e.target.value)}
                    placeholder="agent@company.com"
                    className="w-full px-2 py-1.5 text-sm bg-gray-500 border border-gray-300 rounded text-gray-50 placeholder-gray-100/40 focus:outline-none focus:border-blue"
                  />
                </div>

                {status === 'COMPLETE' && (
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">Completion Note</label>
                    <textarea
                      value={completionNote}
                      onChange={e => setCompletionNote(e.target.value)}
                      rows={3}
                      className="w-full px-2 py-1.5 text-sm bg-gray-500 border border-gray-300 rounded text-gray-50 focus:outline-none focus:border-blue resize-none"
                    />
                  </div>
                )}

                {saveError && <p className="text-xs text-red-400">{saveError}</p>}

                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-10 w-auto px-4 text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save'}
                </Button>
              </section>

              {/* Requester info */}
              <section className="border-t border-gray-500 pt-4">
                <div className="flex justify-between text-xs text-gray-100">
                  <span>
                    From: <span className="text-gray-50 font-medium">{ticket.requesterEmail}</span>
                  </span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
              </section>

              {/* Description */}
              <section className="space-y-2">
                <h3 className="text-xs font-mono font-medium text-blue/70 uppercase tracking-wider">
                  Description
                </h3>
                <p className="text-sm text-gray-50 whitespace-pre-wrap">{ticket.description}</p>
              </section>

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
                  Comments
                </h3>
                {ticket.comments.length === 0 ? (
                  <p className="text-xs text-gray-100/50">No comments yet</p>
                ) : (
                  <ul className="space-y-3">
                    {ticket.comments.map(comment => (
                      <li key={comment.id} className="border border-gray-500 rounded p-3 space-y-1">
                        <div className="flex justify-between text-xs text-gray-100">
                          <span>{comment.authorEmail}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-gray-50 whitespace-pre-wrap">{comment.body}</p>
                      </li>
                    ))}
                  </ul>
                )}
                <AddCommentForm ticketId={ticketId} onCommentAdded={fetchTicket} />
              </section>
            </>
          )}
        </div>
      </div>
    </>
  )
}
