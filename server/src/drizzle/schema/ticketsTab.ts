import { integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const ticketsTab = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: integer('ticketNumber').notNull().unique().generatedAlwaysAsIdentity(),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull().default('HIGH'),
  status: text('status').notNull().default('NEW'),
  requesterEmail: text('requesterEmail').notNull(),
  requesterStaffId: uuid('requesterStaffId'),
  assignedAgentEmail: text('assignedAgentEmail'),
  completionNote: text('completionNote'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})
