import { desc, eq } from 'drizzle-orm'
import { db } from '../../../drizzle/client.js'
import { ticketsTab } from '../../../drizzle/schema/ticketsTab.js'

export async function getMyTickets(requesterEmail: string) {
  return db
    .select()
    .from(ticketsTab)
    .where(eq(ticketsTab.requesterEmail, requesterEmail))
    .orderBy(desc(ticketsTab.createdAt))
}
