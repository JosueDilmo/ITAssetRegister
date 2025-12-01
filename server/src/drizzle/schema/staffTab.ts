import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const staffTab = pgTable('staff', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  department: text('department').notNull(),
  jobTitle: text('jobTitle').notNull(),
  status: text('status').notNull().default('ACTIVE'),
  note: text('note').default(''),
  assetHistoryList: jsonb('assetHistoryList').default([]),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  createdBy: text('createdBy').notNull(),
  changeLog: jsonb('changeLog').default([]),
})
