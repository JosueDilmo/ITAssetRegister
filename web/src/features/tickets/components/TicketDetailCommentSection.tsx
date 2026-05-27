'use client'
import { useRouter } from 'next/navigation'
import { AddCommentForm } from './AddCommentForm'

interface Props {
  ticketId: string
}

export function TicketDetailCommentSection({ ticketId }: Props) {
  const router = useRouter()
  return <AddCommentForm ticketId={ticketId} onCommentAdded={() => router.refresh()} />
}
