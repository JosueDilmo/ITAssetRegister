import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { ticketsTab } from './ticketsTab.js'

export const ticketAttachmentsTab = pgTable('ticketAttachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticketId').notNull().references(() => ticketsTab.id),
  filename: text('filename').notNull(),
  mimeType: text('mimeType').notNull(),
  sharePointUrl: text('sharePointUrl').notNull(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
