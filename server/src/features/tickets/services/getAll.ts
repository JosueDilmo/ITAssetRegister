import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'

interface GetAllTicketsParams {
  status?: string
  priority?: string
  assignedAgentEmail?: string
}

export async function getAllTickets({ status, priority, assignedAgentEmail }: GetAllTicketsParams = {}) {
  const conditions = []
  if (status) conditions.push(eq(ticketsTab.status, status))
  if (priority) conditions.push(eq(ticketsTab.priority, priority))
  if (assignedAgentEmail) conditions.push(eq(ticketsTab.assignedAgentEmail, assignedAgentEmail))

  return db
    .select()
    .from(ticketsTab)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(ticketsTab.createdAt))
}
