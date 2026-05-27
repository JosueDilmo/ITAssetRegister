import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { PageProps } from '@/shared/interface/index'
import { getCurrentITAssetUser } from '@/features/auth/actions/getCurrentITAssetUser'
import { Menu } from '@/features/nav/components/menu'
import { TicketDetailCommentSection } from '@/features/tickets/components/TicketDetailCommentSection'
import { getApiTicketsId } from '@/http/api'

interface Attachment {
  id: string
  filename: string
  sharePointUrl: string
}

interface Comment {
  id: string
  authorEmail: string
  body: string
  createdAt: string | Date
}

export default async function TicketDetailPage(props: PageProps) {
  const { id } = await props.params
  const user = await getCurrentITAssetUser()
  if (!user) redirect('/signin')
  if (user.role !== 'admin') redirect('/tickets')

  const ticket = await getApiTicketsId(id) as unknown as {
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

  const label = `TKT-${String(ticket.ticketNumber).padStart(4, '0')}`

  return (
    <div className="flex w-full">
      <Menu />
      <div className="flex-1 p-6 max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href="/tickets"
            className="text-sm font-medium text-blue hover:opacity-80 transition-opacity"
          >
            ← Back to board
          </Link>
          <span className="font-mono text-sm text-gray-400">{label}</span>
        </div>

        <h1 className="text-xl font-medium text-gray-100">{ticket.subject}</h1>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-4 text-sm border border-gray-700 rounded p-4">
          <div>
            <span className="text-gray-400">Status: </span>
            <span className="text-gray-100">{ticket.status}</span>
          </div>
          <div>
            <span className="text-gray-400">Priority: </span>
            <span className="text-gray-100">{ticket.priority}</span>
          </div>
          <div>
            <span className="text-gray-400">From: </span>
            <span className="text-gray-100">{ticket.requesterEmail}</span>
          </div>
          <div>
            <span className="text-gray-400">Assigned: </span>
            <span className="text-gray-100">{ticket.assignedAgentEmail ?? 'Unassigned'}</span>
          </div>
          <div>
            <span className="text-gray-400">Created: </span>
            <span className="text-gray-100">
              {new Date(ticket.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Description */}
        <section className="space-y-2">
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Description</h2>
          <p className="text-sm text-gray-200 whitespace-pre-wrap">{ticket.description}</p>
        </section>

        {/* Attachments */}
        {ticket.attachments.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Attachments</h2>
            <ul className="space-y-1">
              {ticket.attachments.map(att => (
                <li key={att.id}>
                  <a
                    href={att.sharePointUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
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
          <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Comments</h2>
          {ticket.comments.length === 0 ? (
            <p className="text-xs text-gray-500">No comments</p>
          ) : (
            <ul className="space-y-3">
              {ticket.comments.map(comment => (
                <li key={comment.id} className="border border-gray-700 rounded p-3 space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{comment.authorEmail}</span>
                    <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">{comment.body}</p>
                </li>
              ))}
            </ul>
          )}
          <TicketDetailCommentSection ticketId={ticket.id} />
        </section>
      </div>
    </div>
  )
}
