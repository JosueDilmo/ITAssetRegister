import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { ticketsTab } from './ticketsTab.js'

export const ticketCommentsTab = pgTable('ticketComments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticketId').notNull().references(() => ticketsTab.id, { onDelete: 'cascade' }),
  authorEmail: text('authorEmail').notNull(),
  body: text('body').notNull(),
  source: text('source').notNull().default('agent'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
